import {
  Accessor,
  SignalOptions,
  createRenderEffect,
  onCleanup,
} from "solid-js";
import { createSignal, untrack } from "solid-js";

import { CustomLinkedList, ListNode } from "./list";

export interface TimeTravelSignalOptions<T> {
  keepSameValues?: boolean;
  historyLength?: number;
  signalOptions?: SignalOptions<T> | undefined;
}

export type Setter<T> = <U extends T>(value: T | ((prev: T) => U)) => T;

export type TimeTravelSignal<T> = [
  Accessor<T>,
  Setter<T>,
  {
    undo: VoidFunction;
    redo: VoidFunction;
    clear: VoidFunction;
    size: Accessor<number>;
  }
];

const DEFAULT_OPTIONS = {
  keepSameValues: false,
  historyLength: 100,
  signalOptions: undefined,
};

export function createTimeTravelSignal<T extends any>(
  initialValue: T,
  options?: TimeTravelSignalOptions<T>
): TimeTravelSignal<T> {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };

  const [value, setValue] = createSignal(initialValue, options?.signalOptions);
  const [list, setList] = createSignal(new CustomLinkedList(initialValue));

  let allowedRedoCount = 0;
  // Should not be null
  let currentNodePointer: ListNode<T> | null = list().getLastNode();

  const size = () => list().length();

  const set: Setter<T> = (newValue) =>
    untrack(() => {
      const valueToSet =
        newValue instanceof Function ? newValue(value()) : newValue;

      if (resolvedOptions.keepSameValues || valueToSet !== value()) {
        // we don't need to trigger effects on size twice
        // TODO solve this later
        list().addLast(valueToSet);

        if (list().length() > resolvedOptions.historyLength)
          list().removeFirst();
      }

      setValue(() => valueToSet);

      // If we had some actions to redo
      // we need to prune them
      // TODO maybe clear them from the list?
      if (allowedRedoCount > 0) {
        list().setSize((s) => s - allowedRedoCount);
        allowedRedoCount = 0;
      }

      currentNodePointer = list().getLastNode();

      return valueToSet;
    });

  const undo = () =>
    untrack(() => {
      if (!currentNodePointer) throw new Error();

      if (currentNodePointer.prev === null) return;

      currentNodePointer = currentNodePointer.prev;
      allowedRedoCount += 1;

      setValue(() => currentNodePointer!.value);
    });

  const redo = () =>
    untrack(() => {
      if (allowedRedoCount <= 0) return;

      if (!currentNodePointer) throw new Error();

      if (!currentNodePointer.next) return;

      currentNodePointer = currentNodePointer.next;
      allowedRedoCount -= 1;

      setValue(() => currentNodePointer!.value);
    });

  const clear = () => {
    if (!currentNodePointer) throw new Error();

    setList(new CustomLinkedList(currentNodePointer.value));
  };

  // when list changes we need to clean up the old one
  createRenderEffect(() => {
    const l = list();

    onCleanup(() => l.destroy());
  });

  return [
    value,
    set,
    {
      undo,
      clear,
      size,
      redo,
    },
  ];
}
