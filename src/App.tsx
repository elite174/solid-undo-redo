import type { Component } from "solid-js";

// @ts-ignore
import pkg from "../package.json";

import { createUndoRedoSignal } from "./lib/travel";

const buttonClass = (enabled = true) =>
  `rounded py-1 px-2 ${
    enabled ? "bg-lime-600" : "bg-zinc-200 text-black"
  } transition-colors`;

const HISTORY_LENGTH = 5;

const App: Component = () => {
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

  return (
    <main class="h-screen grid grid-cols-[1fr] grid-rows-[auto] auto-rows-auto gap-10 bg-zinc-900 justify-items-center content-start text-white py-5">
      <h1 class="text-4xl font-bold">
        solid-undo-redo <b>v{pkg.version}</b>
      </h1>
      <p class="text-lime-300 text-center">
        ⚡Add history to your app like EZY PZY⚡
        <br />
        The history is list-based, so it works in O(1)!
        <br />
        <a
          class="text-2xl underline"
          href="https://github.com/elite174/solid-undo-redo"
          target="_blank"
        >
          Github
        </a>
      </p>
      <section class="flex flex-col gap-4 items-center">
        <div class="flex flex-col gap-2 text-center">
          <b class="text-3xl">{value()}</b>
          <span class="text-zinc-400">Signal value</span>
        </div>
        <div class="flex gap-1">
          <button
            class={buttonClass()}
            onClick={() => setValue((v) => (v === undefined ? v : v + 1))}
          >
            Increment
          </button>
          <button
            class={buttonClass()}
            onClick={() => setValue((v) => (v === undefined ? v : v - 1))}
          >
            Decrement
          </button>
        </div>
      </section>
      <section class="flex flex-col gap-4 items-center">
        <div class="flex flex-col gap-1 text-center">
          <b class="text-3xl">[{historyItems()}]</b>
          <span class="text-zinc-400">
            Current history size: {api.size()} <br /> (history length in this
            example is {HISTORY_LENGTH})
          </span>
        </div>
        <div class="flex gap-2">
          <button
            class={buttonClass(api.isUndoPossible())}
            onClick={() => api.undo()}
          >
            Undo
          </button>
          <button
            class={buttonClass(api.isRedoPossible())}
            onClick={() => api.redo()}
          >
            Redo
          </button>
          <button class={buttonClass()} onClick={() => api.clearHistory()}>
            Clear history
          </button>
        </div>
      </section>
    </main>
  );
};

export default App;
