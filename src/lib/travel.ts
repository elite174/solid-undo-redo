import type { Accessor, Setter, SignalOptions } from "solid-js";
import { batch, createMemo, createSignal, untrack } from "solid-js";

export type OnUndoCallback<T> = (currentValue: T, previousValue: T) => void;
export type OnRedoCallback<T> = (currentValue: T, previousValue: T) => void;

export interface UndoRedoSignalOptions<T> {
  /**
   * Max history length
   * @default 100
   */
  historyLength?: number;
  /**
   * Solid signal options
   */
  signalOptions?: SignalOptions<T> | undefined;
  onUndo?: OnUndoCallback<T>;
  onRedo?: OnRedoCallback<T>;
}

export type UndoRedoSignal<T> = [
  /** Reactive accessor for the value */
  get: Accessor<T>,
  /** Setter function for the value */
  set: Setter<T>,
  api: {
    /** Undo callback */
    undo: VoidFunction;
    /** Redo callback */
    redo: VoidFunction;
    /** ClearHistory callback */
    clearHistory: VoidFunction;
    isUndoPossible: Accessor<boolean>;
    isRedoPossible: Accessor<boolean>;
    /**
     * Reactive generator function which is retriggered
     * when history changes
     */
    createHistoryIterator: () => Generator<T, void, unknown>;
    /**
     * Current size of the history
     */
    size: Accessor<number>;
  }
];

class ListNode<T> {
  value: T;
  next: ListNode<T> | null;
  prev: ListNode<T> | null;

  constructor(value: T) {
    this.value = value;
    this.next = null;
    this.prev = null;
  }
}

const DEFAULT_OPTIONS = {
  keepSameValues: false,
  historyLength: 100,
  signalOptions: undefined,
};

const INITIAL_HISTORY_SIZE = 1;
const DEFAULT_COMPARATOR = (prev: unknown, next: unknown) => prev === next;

export function createUndoRedoSignal<T>(): UndoRedoSignal<T | undefined>;
export function createUndoRedoSignal<T>(
  initialValue: T,
  options?: UndoRedoSignalOptions<T>
): UndoRedoSignal<T>;
export function createUndoRedoSignal<T>(
  initialValue?: T,
  options?: UndoRedoSignalOptions<T | undefined>
): UndoRedoSignal<T | undefined> {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
  const equals = resolvedOptions.signalOptions?.equals ?? DEFAULT_COMPARATOR;

  let head = new ListNode<T | undefined>(initialValue);
  let isFirstSetPerformed = initialValue !== undefined;

  const [currentNodePointer, setCurrentNodePointer] = createSignal(head);
  const [iteratorSubscription, triggerIterator] = createSignal(undefined, {
    equals: false,
  });
  const [size, setSize] = createSignal(
    initialValue === undefined ? 0 : INITIAL_HISTORY_SIZE
  );

  let undoCount = 0;
  let maxHistoryLength = resolvedOptions.historyLength;

  if (maxHistoryLength < 1) {
    console.warn("fallback to default historyLength");
    maxHistoryLength = 100;
  }

  const value = createMemo(() => currentNodePointer().value, undefined, {
    name: resolvedOptions.signalOptions?.name,
  });

  const addLast = (value: T) => {
    const p = untrack(currentNodePointer);

    if (!isFirstSetPerformed) {
      isFirstSetPerformed = true;
      p.value = value;
      setSize(INITIAL_HISTORY_SIZE);

      return;
    }

    const newItem = new ListNode<T | undefined>(value);

    // If there's something ahead
    // we need to cut the list from the current pointer
    if (p.next) {
      p.next.prev = null;
      setSize((s) => s - undoCount);
      undoCount = 0;
    }

    p.next = newItem;
    newItem.prev = p;

    setCurrentNodePointer(newItem);

    // if we exceeded the limit of items
    // just move the head
    if (untrack(size) + 1 > maxHistoryLength && head.next) {
      const latestHead = head;
      // move forward
      head = head.next;
      // cleanup the beginning
      head.prev = null;
      latestHead.next = null;
    } else setSize((s) => s + 1);
  };

  const setValue: Setter<T | undefined> = (newValue?: unknown) => {
    const prevValue = untrack(currentNodePointer).value;
    const nextValue =
      typeof newValue === "function"
        ? untrack(() => newValue(prevValue))
        : newValue;

    if (typeof equals === "function" ? equals(prevValue, nextValue) : equals)
      return prevValue;

    batch(() => {
      addLast(nextValue);
      triggerIterator();
    });

    return nextValue;
  };

  const undo = () => {
    const pointer = untrack(currentNodePointer);
    const prevPointer = pointer.prev;

    if (!pointer || !prevPointer) return;

    undoCount++;
    setCurrentNodePointer(prevPointer);

    untrack(() => options?.onUndo?.(prevPointer.value, pointer.value));
  };

  const redo = () => {
    const pointer = untrack(currentNodePointer);
    const nextPointer = pointer.next;

    if (!pointer || !nextPointer) return;

    undoCount--;
    setCurrentNodePointer(nextPointer);

    untrack(() => options?.onRedo?.(nextPointer.value, pointer.value));
  };

  const clearHistory = () => {
    head = new ListNode(untrack(currentNodePointer).value);
    undoCount = 0;

    batch(() => {
      setSize(isFirstSetPerformed ? INITIAL_HISTORY_SIZE : 0);
      triggerIterator();
      setCurrentNodePointer(head);
    });
  };

  function* createHistoryIterator() {
    // make iterator reactive
    iteratorSubscription();

    let currentNode: ListNode<T | undefined> | null = head;

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
      createHistoryIterator,
      size,
    },
  ];
}
