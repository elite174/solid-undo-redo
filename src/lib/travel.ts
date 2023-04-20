import {
  Accessor,
  SignalOptions,
  batch,
  createMemo,
  createSignal,
  untrack,
} from "solid-js";

export interface UndoRedoSignalOptions<T> {
  historyLength?: number;
  signalOptions?: SignalOptions<T> | undefined;
}

export type Setter<T> = (<U extends T>(value: (prev: T) => U) => U) &
  (<U extends T>(value: Exclude<U, Function>) => U);

export type UndoRedoSignal<T> = [
  value: Accessor<T>,
  setValue: Setter<T>,
  api: {
    undo: VoidFunction;
    redo: VoidFunction;
    clearHistory: VoidFunction;
    isUndoPossible: Accessor<boolean>;
    isRedoPossible: Accessor<boolean>;
    historyReactiveIterator: () => Generator<T, void, unknown>;
  }
];

class ListNode<T> {
  value: T;
  next: ListNode<T> | null;
  prev: ListNode<T> | null;
  timestamp: number;

  constructor(value: T) {
    this.value = value;
    this.next = null;
    this.prev = null;
    this.timestamp = performance.now();
  }
}

const DEFAULT_OPTIONS = {
  keepSameValues: false,
  historyLength: 100,
  signalOptions: undefined,
};

const INITIAL_HISTORY_SIZE = 0;
const DEFAULT_COMPARATOR = (prev: unknown, next: unknown) => prev === next;

export const createUndoRedoSignal = <T>(
  initialValue: T,
  options?: UndoRedoSignalOptions<T>
): UndoRedoSignal<T> => {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
  const equals = resolvedOptions.signalOptions?.equals ?? DEFAULT_COMPARATOR;

  let head = new ListNode<T>(initialValue);

  const [historySize, setHistorySize] = createSignal(INITIAL_HISTORY_SIZE);

  const [currentNodePointer, setCurrentNodePointer] = createSignal(head);

  let maxHistoryLength = resolvedOptions.historyLength;

  if (maxHistoryLength < 1) {
    console.warn("fallback to default historyLength");
    maxHistoryLength = 100;
  }

  const value = createMemo(() => currentNodePointer().value, undefined, {
    name: resolvedOptions.signalOptions?.name,
  });

  const addLast = (value: T) => {
    const newItem = new ListNode<T>(value);
    const p = untrack(currentNodePointer);
    const currentSize = untrack(historySize);

    // If there's something ahead
    // we need to cut the list from the current pointer
    if (p.next) p.next.prev = null;

    p.next = newItem;
    newItem.prev = p;

    batch(() => {
      setCurrentNodePointer(newItem);

      // if we exceeded the limit of items
      // just move the head
      if (currentSize + 1 > maxHistoryLength && head.next) {
        const latestHead = head;
        // move forward
        head = head.next;
        // cleanup the beginning
        head.prev = null;
        latestHead.next = null;
      } else setHistorySize(currentSize + 1);
    });
  };

  const setValue: Setter<T> = (newValue) => {
    const prevValue = untrack(currentNodePointer).value;
    const nextValue =
      newValue instanceof Function
        ? untrack(() => newValue(prevValue))
        : newValue;

    if (typeof equals === "function" ? equals(prevValue, nextValue) : equals)
      return prevValue as any;

    addLast(nextValue);

    return nextValue;
  };

  const undo = () => {
    const pointer = untrack(currentNodePointer);
    const prevPointer = pointer.prev;

    if (!pointer || !prevPointer) return;

    setCurrentNodePointer(prevPointer);
  };

  const redo = () => {
    const pointer = untrack(currentNodePointer);
    const nextPointer = pointer.next;

    if (!pointer || !nextPointer) return;

    setCurrentNodePointer(nextPointer);
  };

  const clearHistory = () => {
    head = new ListNode(untrack(currentNodePointer).value);

    batch(() => {
      setCurrentNodePointer(head);
      setHistorySize(INITIAL_HISTORY_SIZE);
    });
  };

  function* historyReactiveIterator() {
    // make generator reactive
    currentNodePointer();

    let currentNode: ListNode<T> | null = head;

    while (currentNode !== null) {
      yield currentNode.value;

      currentNode = currentNode.next;
    }

    return;
  }

  return [
    value,
    setValue,
    {
      undo,
      redo,
      clearHistory,
      isUndoPossible: () => Boolean(currentNodePointer().prev),
      isRedoPossible: () => Boolean(currentNodePointer().next),
      historyReactiveIterator,
    },
  ];
};
