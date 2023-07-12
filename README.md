# solid-undo-redo

A small library for undo-redo operations!
Make signals with history.
The implementation is list-based, so it works in **O(1)** instead of O(n)!

## Features

- Make `undo` or `redo` operations
- Set your history length
- React on undo and redo events with callbacks
- Turn your history into reactive iterator

## Installation

`npm i solid-undo-redo`

`pnpm add solid-undo-redo`

`yarn add solid-undo-redo`

## Usage

```tsx
import {createUndoRedoSignal} from 'solid-undo-redo';

const [value, setValue, api] = createUndoRedoSignal<number | undefined>(
  undefined,
  {
    historyLength: HISTORY_LENGTH,
  }
);

setValue(1);

// Since we haven't provided the initial value (undefined)
// the history length equals to 1
console.assert(api.size() === 1);

// Since the history length is 1
// we can't do undo and redo
console.assert(api.isUndoPossible() === false);
console.assert(api.isRedoPossible() === false);

setValue(2);

// We added new value to the history
console.assert(api.size() === 2);

// Now we can make undo operation
console.assert(api.isUndoPossible() === true);
// However we can't do redo because we're at the end
// of our history
console.assert(api.isRedoPossible() === false);

// let's add some undo/redo listeners
api.registerCallback("undo", (currentValue, previousValue) =>
  console.log(`Undo: ${currentValue}, ${previousValue}`)
);

api.registerCallback("redo", (currentValue, previousValue) => {
  console.log(`Redo: ${currentValue}, ${previousValue}`);
});

// Don't forget to remove these listeners with api.removeCallback
// when you don't need them!

api.undo();
// You'll see in the console "Undo: 1, 2"

// Now we can't make undo operations
// because we're at the beginning of our history
console.assert(api.isUndoPossible() === false);
// But we can do redo!
console.assert(api.isRedoPossible() === true);

api.redo();
// You'll see in the console "Redo: 2, 1"

// Let's have a look at our history
const historyItems = () => {
  const items = [];

  for (const value of api.createHistoryIterator()) {
    items.push(value);
  }

  return items.join(", ");
};

console.log(historyItems()); // [1, 2]

// Now let's clear our history and callbacks
api.dispose();
```

## Docs

```tsx
function createUndoRedoSignal<T>(
  initialValue?: T,
  options?: UndoRedoSignalOptions<T | undefined>
): UndoRedoSignal<T | undefined>;

type CallbackTypeMap<T> = {
  undo: (currentValue: T, previousValue: T) => void;
  redo: (currentValue: T, previousValue: T) => void;
};

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
}

export type UndoRedoAPI<T> = {
  undo: VoidFunction;
  redo: VoidFunction;

  /**
   * ClearHistory callback
   * @param clearCurrentValue - clears current value if set to true
   * @default false
   */
  clearHistory: (clearCurrentValue?: boolean) => void;

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

  /** Clear all registered callbacks and history */
  dispose: VoidFunction;
};

export type UndoRedoSignal<T> = [
  /** Reactive accessor for the value */
  get: Accessor<T>,
  /** Setter function for the value */
  set: Setter<T>,
  api: UndoRedoAPI<T>
];
```
