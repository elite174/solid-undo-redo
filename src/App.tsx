import { Component } from "solid-js";

import { createUndoRedoSignal } from "./lib/travel";

const App: Component = () => {
  const [value, setValue, api] = createUndoRedoSignal(1, { historyLength: 10 });

  const historyItems = () => {
    const items = [];

    for (const value of api.historyReactiveIterator()) {
      items.push(value);
    }

    return items.join(", ");
  };

  return (
    <section>
      <span>Signal value: {value()}</span>
      <button onClick={() => setValue((v) => v + 1)}>Increment</button>
      <button onClick={() => setValue((v) => v - 1)}>Decrement</button>
      <br />
      <span> History: {historyItems()}</span>
      <div>
        <button onClick={() => api.undo()}>Undo</button>
        <button onClick={() => api.redo()}>Redo</button>
        <button onClick={() => api.clearHistory()}>Clear history</button>
      </div>
    </section>
  );
};

export default App;
