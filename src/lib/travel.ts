import {
  createMemo,
  createSignal,
  from,
  untrack,
  SignalOptions,
} from "solid-js";
import { CustomLinkedList, ListNode } from "./list";

interface Options<T> {
  keepSameValues?: boolean;
  historyLength?: number;
  signalOptions?: SignalOptions<T> | undefined;
}

const DEFAULT_OPTIONS = {
  keepSameValues: false,
  historyLength: 100,
  signalOptions: undefined,
};

export const createTimeTravelSignal = <T>(
  initialValue: T,
  options?: Options<T>
) => {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };

  const [value, setValue] = createSignal(initialValue, options?.signalOptions);
  const [list, setList] = createSignal(new CustomLinkedList(initialValue));

  const [allowedRedoCount, setAllowedRedoCount] = createSignal(0);
  // Should not be null
  let currentNodePointer: ListNode<T> | null = list().getLastNode();

  const sizeSignal = createMemo(() => {
    const currentList = list();

    const sizeSignal = from<number>((set) => {
      set(currentList.length());

      currentList.subscribe(set);

      return () => currentList.unsubscribe(set);
    });

    return sizeSignal;
  });

  const size = createMemo(() => {
    return (sizeSignal()() ?? 0) - allowedRedoCount();
  });

  const set = (newValue: T) =>
    untrack(() => {
      if (resolvedOptions.keepSameValues || newValue !== value()) {
        // we don't need to trigger effects on size twice
        // TODO solve this later
        list().addLast(newValue);

        if (list().length() > resolvedOptions.historyLength)
          list().removeFirst();
      }

      setValue(() => newValue);

      currentNodePointer = list().getLastNode();
      setAllowedRedoCount(0);
    });

  const undo = () =>
    untrack(() => {
      if (!currentNodePointer) throw new Error();

      if (currentNodePointer.prev === null) return;

      currentNodePointer = currentNodePointer.prev;
      setAllowedRedoCount((c) => c + 1);

      setValue(() => currentNodePointer!.value);
    });

  const redo = () =>
    untrack(() => {
      if (allowedRedoCount() <= 0) return;

      if (!currentNodePointer) throw new Error();

      if (!currentNodePointer.next) return;

      currentNodePointer = currentNodePointer.next;
      setAllowedRedoCount((c) => c - 1);

      setValue(() => currentNodePointer!.value);
    });

  const clear = () => {
    if (!currentNodePointer) throw new Error();

    setList(new CustomLinkedList(currentNodePointer.value));
  };

  return [
    value,
    set,
    {
      undo,
      clear,
      size,
      redo,
    },
  ] as const;
};
