# solid-undo-redo

[![version](https://img.shields.io/npm/v/solid-undo-redo?style=for-the-badge)](https://www.npmjs.com/package/solid-undo-redo)
![npm](https://img.shields.io/npm/dw/solid-undo-redo?style=for-the-badge)

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
import { createSignalWithHistory } from "solid-undo-redo";

const [value, setValue, history] = createSignalWithHistory<number | undefined>(
  undefined,
  { historyLength: 10 }
);

setValue(1);

// Since we haven't provided the initial value (undefined)
// the history length equals to 1
console.assert(history.size() === 1);

// Since the history length is 1
// we can't do undo and redo
console.assert(history.isUndoPossible() === false);
console.assert(history.isRedoPossible() === false);

setValue(2);

// We added new value to the history
console.assert(history.size() === 2);

// Now we can make undo operation
console.assert(history.isUndoPossible() === true);
// However we can't do redo because we're at the end
// of our history
console.assert(history.isRedoPossible() === false);

// let's add some undo/redo listeners
history.registerCallback("undo", (currentValue, previousValue) =>
  console.log(`Undo: ${currentValue}, ${previousValue}`)
);

history.registerCallback("redo", (currentValue, previousValue) => {
  console.log(`Redo: ${currentValue}, ${previousValue}`);
});

// Don't forget to remove these listeners with api.removeCallback
// when you don't need them!

history.undo();
// You'll see in the console "Undo: 1, 2"

// Now we can't make undo operations
// because we're at the beginning of our history
console.assert(history.isUndoPossible() === false);
// But we can do redo!
console.assert(history.isRedoPossible() === true);

history.redo();
// You'll see in the console "Redo: 2, 1"

// Let's have a look at our history
console.log(history.toArray()); // [1, 2]

// You can also use history.arraySignal
// To get a reactive accessor of the history array

// Now let's clear our history and callbacks
history.dispose();
```

## Docs

```tsx
function createSignalWithHistory<T>(
  initialValue?: T,
  options?: SignalWithHistoryOptions<T | undefined>
): SignalWithHistory<T | undefined>;

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
```
