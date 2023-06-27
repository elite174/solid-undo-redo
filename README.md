# solid-undo-redo

A small library for undo-redo operations!
Make signals with history.
The implementation is list-based, so it works in **O(1)** instead of O(n)!

## Installation

`npm i solid-undo-redo`

`pnpm add solid-undo-redo`

`yarn add solid-undo-redo`

## Usage

```tsx
import {createUndoRedoSignal} from 'solid-undo-redo';

...

const [
    value,
    setValue,
    {
      undo,
      redo,
      isRedoPossible,
      isUndoPossible,
      size,
      clearHistory,
      reactiveHistoryGenerator,
    },
  ] = createUndoRedoSignal<number>(1, {
    // you can pass custom length
    historyLength: HISTORY_LENGTH,
  });

// To convert history items to an array you can use reactive generator like this:
const historyItems = () => {
    const items: number[] = [];

    for (const value of api.reactiveHistoryGenerator()) {
      items.push(value);
    }

    return items;
};

...

//somewhere in JSX:

return <div>History: {historyItems().join(', ')}</div>
```

## Params

```tsx
declare function createUndoRedoSignal<T>(
  initialValue: T,
  options?: UndoRedoSignalOptions<T>
): UndoRedoSignal<T>;

type OnUndoCallback<T> = (currentValue: T, previousValue: T) => void;
type OnRedoCallback<T> = (currentValue: T, previousValue: T) => void;

interface UndoRedoSignalOptions<T> {
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

type UndoRedoSignal<T> = [
  /** Reactive accessor for the value */
  value: Accessor<T>,
  /** Setter function for the value */
  setValue: Setter<T>,
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
    reactiveHistoryGenerator: () => Generator<T, void, unknown>;
    /**
     * Current size of the history
     */
    size: Accessor<number>;
  }
];

type Setter<T> = (<U extends T>(value: (prev: T) => U) => U) &
  (<U extends T>(value: Exclude<U, Function>) => U);
```
