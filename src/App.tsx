import { Component, createSignal } from "solid-js";

import styles from "./App.module.css";
import { createTimeTravelSignal } from "./lib/travel";

const App: Component = () => {
  const [a, {}] = createTimeTravelSignal(1);

  return <div class={styles.App}>{a()}</div>;
};

export default App;
