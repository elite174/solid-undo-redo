import type { Accessor, Setter, SignalOptions } from "solid-js";
import {
  batch,
  createComputed,
  createMemo,
  createSignal,
  on,
  untrack,
} from "solid-js";

type CallbackTypeMap<T> = {
  undo: (currentValue: T, previousValue: T) => void;
  redo: (currentValue: T, previousValue: T) => void;
};

export interface SignalWithHistoryOptions<T> {
  /**
   * Max history length
   * @default 100
   */
  historyLength?: number;
  /**
   * Solid signal options
   */
  signalOptions?: SignalOptions<T> | undefined;
}

export type History<T> = {
  undo: VoidFunction;
  redo: VoidFunction;

  /**
   * Cleas the history
   * @param clearCurrentValue - clears current value if set to true
   * @default false
   */
  clear: (clearCurrentValue?: boolean) => void;

  /** Reactive signal which indicates if undo operation is possible */
  isUndoPossible: Accessor<boolean>;
  /** Reactive signal which indicates if redo operation is possible */
  isRedoPossible: Accessor<boolean>;

  /**
   * Reactive generator function which is retriggered
   * when the history changes
   */
  createHistoryIterator: () => Generator<T, void, unknown>;

  /**
   * Reactive signal which shows the current history length
   */
  size: Accessor<number>;

  /** Register callback for undo/redo */
  registerCallback: <CallbackType extends keyof CallbackTypeMap<T>>(
    type: CallbackType,
    listener: CallbackTypeMap<T>[CallbackType]
  ) => void;

  /** Remove callback for undo/redo */
  removeCallback: <CallbackType extends keyof CallbackTypeMap<T>>(
    type: CallbackType,
    listener: CallbackTypeMap<T>[CallbackType]
  ) => void;

  /** Returns non-reactive history array */
  toArray: () => Array<T>;

  /** Reactive signal of history array */
  arraySignal: Accessor<Array<T>>;

  /** Clear all registered callbacks and history */
  dispose: VoidFunction;
};

export type SignalWithHistory<T> = [
  /** Reactive accessor for the value */
  get: Accessor<T>,
  /** Setter function for the value */
  set: Setter<T>,
  history: History<T>
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

export function createSignalWithHistory<T>(): SignalWithHistory<T | undefined>;
export function createSignalWithHistory<T>(
  initialValue: T,
  options?: SignalWithHistoryOptions<T>
): SignalWithHistory<T>;
export function createSignalWithHistory<T>(
  initialValue?: T,
  options?: SignalWithHistoryOptions<T | undefined>
): SignalWithHistory<T | undefined> {
  const callbackMap: {
    [CallbackType in keyof CallbackTypeMap<T | undefined>]: Set<
      CallbackTypeMap<T | undefined>[CallbackType]
    >;
  } = {
    undo: new Set(),
    redo: new Set(),
  };

  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };

  let head = new ListNode<T | undefined>(initialValue);

  const [_value, setValue] = createSignal<T | undefined>(
    initialValue,
    options?.signalOptions
  );
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

  const addLast = (value: T | undefined) => {
    const p = untrack(currentNodePointer);

    if (p.value === undefined) {
      const newHead = new ListNode(value);

      head = newHead;

      batch(() => {
        setCurrentNodePointer(newHead);
        setSize(INITIAL_HISTORY_SIZE);
      });

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

  createComputed(
    on(
      _value,
      (nextValue) =>
        batch(() => {
          addLast(nextValue);
          triggerIterator();
        }),
      { defer: true }
    )
  );

  const undo = () => {
    const pointer = untrack(currentNodePointer);
    const prevPointer = pointer.prev;

    if (!pointer || !prevPointer) return;

    undoCount++;
    setCurrentNodePointer(prevPointer);

    untrack(() =>
      callbackMap.undo.forEach((callback) =>
        callback(prevPointer.value, pointer.value)
      )
    );
  };

  const redo = () => {
    const pointer = untrack(currentNodePointer);
    const nextPointer = pointer.next;

    if (!pointer || !nextPointer) return;

    undoCount--;
    setCurrentNodePointer(nextPointer);

    untrack(() =>
      callbackMap.redo.forEach((callback) =>
        callback(nextPointer.value, pointer.value)
      )
    );
  };

  const clear = (clearCurrentValue = false) => {
    head = new ListNode(
      clearCurrentValue ? undefined : untrack(currentNodePointer).value
    );
    undoCount = 0;

    batch(() => {
      setSize(Boolean(head.value) ? INITIAL_HISTORY_SIZE : 0);
      triggerIterator();
      setCurrentNodePointer(head);
    });
  };

  function* createHistoryIterator() {
    // make iterator reactive
    iteratorSubscription();

    let currentNode: ListNode<T | undefined> | null = head;

    while (currentNode !== null && currentNode.value !== undefined) {
      yield currentNode.value;

      currentNode = currentNode.next;
    }

    return;
  }

  const registerCallback: History<T | undefined>["registerCallback"] = (
    type,
    callback
  ) => {
    callbackMap[type]?.add(callback);
  };

  const removeCallback: History<T | undefined>["removeCallback"] = (
    type,
    callback
  ) => {
    callbackMap[type]?.delete(callback);
  };

  const dispose = () => {
    Object.values(callbackMap).forEach((set) => set.clear());

    clear();
  };

  const value = createMemo(() => currentNodePointer().value);

  const getHistoryArray = () => {
    const result: Array<T | undefined> = [];

    for (const item of createHistoryIterator()) {
      result.push(item);
    }

    return result;
  };

  const toArray = () => untrack(getHistoryArray);

  const arraySignal = createMemo(() => getHistoryArray());

  return [
    value,
    setValue,
    {
      undo,
      redo,
      clear,
      isUndoPossible: () => Boolean(currentNodePointer().prev),
      isRedoPossible: () => Boolean(currentNodePointer().next),
      createHistoryIterator,
      size,
      registerCallback,
      removeCallback,
      toArray,
      arraySignal,
      dispose,
    },
  ];
}
