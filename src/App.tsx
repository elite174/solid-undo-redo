import { Component } from "solid-js";

// @ts-ignore
import pkg from "../package.json";

import { createUndoRedoSignal } from "./lib/travel";

const buttonClass = (enabled = true) =>
  `rounded py-1 px-2 ${
    enabled ? "bg-lime-600" : "bg-zinc-200 text-black"
  } transition-colors`;

const HISTORY_LENGTH = 5;

const App: Component = () => {
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
  ] = createUndoRedoSignal(1, {
    historyLength: HISTORY_LENGTH,
  });

  const historyItems = () => {
    const items = [];

    for (const value of reactiveHistoryGenerator()) {
      items.push(value);
    }

    return items.join(", ");
  };

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
          <button class={buttonClass()} onClick={() => setValue((v) => v + 1)}>
            Increment
          </button>
          <button class={buttonClass()} onClick={() => setValue((v) => v - 1)}>
            Decrement
          </button>
        </div>
      </section>
      <section class="flex flex-col gap-4 items-center">
        <div class="flex flex-col gap-1 text-center">
          <b class="text-3xl">[{historyItems()}]</b>
          <span class="text-zinc-400">
            Current history <br /> (history length in this example is{" "}
            {HISTORY_LENGTH})
          </span>
        </div>
        <div class="flex gap-2">
          <button class={buttonClass(isUndoPossible())} onClick={() => undo()}>
            Undo
          </button>
          <button class={buttonClass(isRedoPossible())} onClick={() => redo()}>
            Redo
          </button>
          <button class={buttonClass()} onClick={() => clearHistory()}>
            Clear history
          </button>
        </div>
      </section>
    </main>
  );
};

export default App;
