import { createComputed, createRoot } from "solid-js";
import { describe, expect, it, vitest } from "vitest";

import { createSignalWithHistory } from "./travel";

const wrapReactive = (fn: VoidFunction) => {
  const dispose = createRoot((dispose) => {
    fn();

    return dispose;
  });

  dispose();
};

describe(createSignalWithHistory.name, () => {
  it("should be correctly initialized", () => {
    wrapReactive(() => {
      const [value, _, { isRedoPossible, isUndoPossible }] =
        createSignalWithHistory(1);

      expect(value()).toBe(1);
      expect(isRedoPossible()).toBe(false);
      expect(isUndoPossible()).toBe(false);
    });
  });

  it("should set items correctly", () => {
    wrapReactive(() => {
      const [value, setValue] = createSignalWithHistory(1);

      expect(value()).toBe(1);

      setValue(2);

      expect(value()).toBe(2);

      setValue((v) => v + 2);

      expect(value()).toBe(4);
    });
  });

  describe("set method", () => {
    it("should add new items to the history", () => {
      wrapReactive(() => {
        const [value, setValue, { isUndoPossible }] =
          createSignalWithHistory(1);

        expect(isUndoPossible()).toBe(false);

        setValue(3);

        expect(value()).toBe(3);
        expect(isUndoPossible()).toBe(true);
      });
    });
  });

  describe("undo method", () => {
    it("should correctly undo the last value", () => {
      wrapReactive(() => {
        const [value, setValue, { undo, isUndoPossible }] =
          createSignalWithHistory(1);

        setValue(2);

        expect(isUndoPossible()).toBe(true);
        expect(value()).toBe(2);

        undo();

        expect(value()).toBe(1);
        expect(isUndoPossible()).toBe(false);
      });
    });

    it("should work correctly with empty history", () => {
      wrapReactive(() => {
        const [value, _, { undo, isUndoPossible }] = createSignalWithHistory(1);

        expect(isUndoPossible()).toBe(false);
        undo();

        expect(value()).toBe(1);
        expect(isUndoPossible()).toBe(false);
      });
    });

    it("should work correctly withoverflow", () => {
      wrapReactive(() => {
        const [
          value,
          setValue,
          { undo, isRedoPossible, isUndoPossible, createHistoryIterator, size },
        ] = createSignalWithHistory(1, { historyLength: 3 });

        expect(value()).toBe(1);
        expect(isRedoPossible()).toBe(false);
        expect(isUndoPossible()).toBe(false);

        undo();

        expect(value()).toBe(1);
        expect(isRedoPossible()).toBe(false);
        expect(isUndoPossible()).toBe(false);

        setValue(2);
        setValue(3);
        setValue(4);

        expect(value()).toBe(4);
        expect(isRedoPossible()).toBe(false);
        expect(isUndoPossible()).toBe(true);

        undo();

        expect(value()).toBe(3);
        expect(isRedoPossible()).toBe(true);
        expect(isUndoPossible()).toBe(true);

        setValue(5);

        expect(value()).toBe(5);
        expect(isRedoPossible()).toBe(false);
        expect(isUndoPossible()).toBe(true);
        expect(size()).toBe(3);

        const history = [];
        for (const item of createHistoryIterator()) history.push(item);

        expect(history).toStrictEqual([2, 3, 5]);
      });
    });
  });
});

describe("clear method", () => {
  it("should work correctly", () => {
    wrapReactive(() => {
      const [
        value,
        setValue,
        { clear: clearHistory, isUndoPossible, isRedoPossible, size },
      ] = createSignalWithHistory(1);

      expect(value()).toBe(1);

      setValue(2);

      expect(value()).toBe(2);
      expect(isUndoPossible()).toBe(true);
      expect(isRedoPossible()).toBe(false);

      clearHistory();

      expect(value()).toBe(2);
      expect(isUndoPossible()).toBe(false);
      expect(isRedoPossible()).toBe(false);
      expect(size()).toBe(1);
    });
  });

  it("should clear with flag = true correctly", () => {
    wrapReactive(() => {
      const [
        value,
        setValue,
        { clear: clearHistory, isUndoPossible, isRedoPossible, size },
      ] = createSignalWithHistory(1);

      expect(value()).toBe(1);

      setValue(2);

      expect(value()).toBe(2);
      expect(isUndoPossible()).toBe(true);
      expect(isRedoPossible()).toBe(false);

      clearHistory(true);

      expect(value()).toBe(undefined);
      expect(isUndoPossible()).toBe(false);
      expect(isRedoPossible()).toBe(false);
      expect(size()).toBe(0);

      setValue(1);

      expect(value()).toBe(1);
      expect(isUndoPossible()).toBe(false);
      expect(isRedoPossible()).toBe(false);
      expect(size()).toBe(1);
    });
  });
});

describe("redo function", () => {
  it("should work correctly", () => {
    wrapReactive(() => {
      const [value, setValue, { redo, isRedoPossible }] =
        createSignalWithHistory(1);

      expect(value()).toBe(1);
      expect(isRedoPossible()).toBe(false);

      redo();

      expect(value()).toBe(1);
      expect(isRedoPossible()).toBe(false);

      setValue(2);

      expect(value()).toBe(2);
      expect(isRedoPossible()).toBe(false);
    });
  });

  it("should work correctly with undo", () => {
    wrapReactive(() => {
      const [value, setValue, { redo, undo, isRedoPossible, isUndoPossible }] =
        createSignalWithHistory(1);

      expect(value()).toBe(1);
      expect(isRedoPossible()).toBe(false);
      expect(isUndoPossible()).toBe(false);

      undo();

      expect(value()).toBe(1);
      expect(isRedoPossible()).toBe(false);
      expect(isUndoPossible()).toBe(false);

      setValue(2);

      expect(value()).toBe(2);
      expect(isRedoPossible()).toBe(false);
      expect(isUndoPossible()).toBe(true);

      undo();

      expect(value()).toBe(1);
      expect(isRedoPossible()).toBe(true);
      expect(isUndoPossible()).toBe(false);

      redo();

      expect(value()).toBe(2);
      expect(isRedoPossible()).toBe(false);
      expect(isUndoPossible()).toBe(true);
    });
  });
});

describe("custom signal options option", () => {
  it("should work with custom comparator function", () => {
    wrapReactive(() => {
      const [value, setValue, { isUndoPossible }] = createSignalWithHistory(
        "123",
        {
          signalOptions: { equals: (prev, next) => prev[0] === next[0] },
        }
      );

      expect(value()).toBe("123");
      expect(isUndoPossible()).toBe(false);

      setValue("12355");

      expect(value()).toBe("123");
      expect(isUndoPossible()).toBe(false);
    });
  });

  it("should keep same values if equals === false", () => {
    wrapReactive(() => {
      const [value, setValue, { isUndoPossible }] = createSignalWithHistory(
        "123",
        {
          signalOptions: { equals: false },
        }
      );

      expect(value()).toBe("123");
      expect(isUndoPossible()).toBe(false);

      setValue("123");

      expect(value()).toBe("123");
      expect(isUndoPossible()).toBe(true);
    });
  });
});

describe("onUndo, onRedo callbacks", () => {
  it("should work correctly", () => {
    wrapReactive(() => {
      const onUndo = vitest.fn();
      const onRedo = vitest.fn();

      const [_, setValue, { undo, redo, registerCallback, dispose }] =
        createSignalWithHistory<number>(1);

      registerCallback("undo", onUndo);
      registerCallback("redo", onRedo);

      setValue(2);

      undo();

      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(onUndo).toHaveBeenCalledWith(1, 2);

      redo();

      expect(onRedo).toHaveBeenCalledOnce();
      expect(onRedo).toHaveBeenCalledWith(2, 1);

      dispose();
    });

    wrapReactive(() => {
      const onUndo = vitest.fn();
      const onRedo = vitest.fn();

      const [_, setValue, { undo, redo, registerCallback, dispose }] =
        createSignalWithHistory<number>(1);

      registerCallback("undo", onUndo);
      registerCallback("redo", onRedo);

      setValue(2);
      setValue(3);

      undo();

      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(onUndo).toHaveBeenCalledWith(2, 3);

      undo();

      expect(onUndo).toHaveBeenCalledTimes(2);
      expect(onUndo).toHaveBeenCalledWith(1, 2);

      redo();

      expect(onRedo).toHaveBeenCalledTimes(1);
      expect(onRedo).toHaveBeenCalledWith(2, 1);

      redo();

      expect(onRedo).toHaveBeenCalledTimes(2);
      expect(onRedo).toHaveBeenCalledWith(3, 2);

      dispose();
    });
  });

  it("should work in edge cases", () => {
    wrapReactive(() => {
      const onUndo = vitest.fn();
      const onRedo = vitest.fn();

      const [_, _1, { undo, redo, registerCallback, dispose }] =
        createSignalWithHistory<number>(1);

      registerCallback("undo", onUndo);
      registerCallback("redo", onRedo);

      undo();

      expect(onUndo).toHaveBeenCalledTimes(0);

      redo();

      expect(onRedo).toHaveBeenCalledTimes(0);

      dispose();
    });

    wrapReactive(() => {
      const onUndo = vitest.fn();
      const onRedo = vitest.fn();

      const [_, setValue, { undo, registerCallback, dispose }] =
        createSignalWithHistory<number>(1);

      registerCallback("undo", onUndo);
      registerCallback("redo", onRedo);

      undo();

      expect(onUndo).toHaveBeenCalledTimes(0);

      setValue(2);

      undo();
      undo();

      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(onUndo).toHaveBeenCalledWith(1, 2);

      dispose();
    });
  });
});

describe("Undo/redo callbacks", () => {
  it("should register callbacks", () => {
    wrapReactive(() => {
      const onUndo = vitest.fn();
      const onRedo = vitest.fn();

      const [v, setV, { undo, redo, registerCallback, dispose }] =
        createSignalWithHistory();

      registerCallback("undo", onUndo);
      registerCallback("redo", onRedo);

      setV(1);
      setV(2);

      undo();
      redo();

      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(onRedo).toHaveBeenCalledTimes(1);

      dispose();
    });
  });

  it("should remove callbacks", () => {
    wrapReactive(() => {
      const onUndo = vitest.fn();
      const onRedo = vitest.fn();

      const [
        v,
        setV,
        { undo, redo, registerCallback, dispose, removeCallback },
      ] = createSignalWithHistory();

      registerCallback("undo", onUndo);
      registerCallback("redo", onRedo);

      setV(1);
      setV(2);

      undo();
      redo();

      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(onRedo).toHaveBeenCalledTimes(1);

      removeCallback("undo", onUndo);
      removeCallback("redo", onRedo);

      undo();
      redo();

      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(onRedo).toHaveBeenCalledTimes(1);

      dispose();
    });
  });
});

describe("Dispose function", () => {
  it("should work correctly", () => {
    wrapReactive(() => {
      const onUndo = vitest.fn();
      const onRedo = vitest.fn();

      const [v, setV, { undo, redo, size, registerCallback, dispose }] =
        createSignalWithHistory();

      registerCallback("undo", onUndo);
      registerCallback("redo", onRedo);

      setV(1);
      setV(2);

      undo();
      redo();

      expect(size()).toBe(2);
      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(onRedo).toHaveBeenCalledTimes(1);

      dispose();

      undo();
      redo();

      expect(size()).toBe(1);
      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(onRedo).toHaveBeenCalledTimes(1);
    });
  });
});

describe("Late value set", () => {
  it("should show correct size", () => {
    wrapReactive(() => {
      const [value, setValue, { size }] = createSignalWithHistory();

      expect(size()).toBe(0);
    });
  });

  it("should correctly increase size after first set", () => {
    wrapReactive(() => {
      const [value, setValue, { size }] = createSignalWithHistory();

      expect(size()).toBe(0);
      expect(value()).toBe(undefined);

      setValue(1);

      console.log(size());

      expect(size()).toBe(1);
      expect(value()).toBe(1);
    });

    wrapReactive(() => {
      const [value, setValue, { size }] = createSignalWithHistory();

      expect(size()).toBe(0);
      expect(value()).toBe(undefined);

      setValue(undefined);

      expect(size()).toBe(0);
      expect(value()).toBe(undefined);
    });

    wrapReactive(() => {
      const [value, setValue, { size }] = createSignalWithHistory(undefined, {
        signalOptions: { equals: false },
      });

      expect(size()).toBe(0);
      expect(value()).toBe(undefined);

      setValue(undefined);

      expect(size()).toBe(1);
      expect(value()).toBe(undefined);
    });
  });

  it("should correctly show possibilities", () => {
    wrapReactive(() => {
      const [value, setValue, { size, isRedoPossible, isUndoPossible }] =
        createSignalWithHistory();

      expect(size()).toBe(0);

      expect(isRedoPossible()).toBe(false);
      expect(isUndoPossible()).toBe(false);
    });

    wrapReactive(() => {
      const [value, setValue, { size, isRedoPossible, isUndoPossible }] =
        createSignalWithHistory();

      expect(size()).toBe(0);

      setValue(1);

      expect(size()).toBe(1);
      expect(value()).toBe(1);

      expect(isRedoPossible()).toBe(false);
      expect(isUndoPossible()).toBe(false);
    });
  });

  it("should correctly reset history", () => {
    wrapReactive(() => {
      const [value, setValue, { size, clear: clearHistory }] =
        createSignalWithHistory();

      expect(size()).toBe(0);

      setValue(1);

      expect(size()).toBe(1);

      clearHistory();

      expect(size()).toBe(1);
    });

    wrapReactive(() => {
      const [value, setValue, { size, clear: clearHistory }] =
        createSignalWithHistory();

      expect(size()).toBe(0);

      clearHistory();

      expect(size()).toBe(0);
    });
  });

  describe("onUndo, onRedo callbacks", () => {
    it("should work correctly", () => {
      wrapReactive(() => {
        const onUndo = vitest.fn();
        const onRedo = vitest.fn();

        const [_, setValue, { undo, redo, registerCallback, dispose }] =
          createSignalWithHistory<number | undefined>(undefined);

        registerCallback("undo", onUndo);
        registerCallback("redo", onRedo);

        setValue(1);

        undo();

        expect(onUndo).toHaveBeenCalledTimes(0);

        setValue(2);
        undo();

        expect(onUndo).toHaveBeenCalledTimes(1);
        expect(onUndo).toHaveBeenCalledWith(1, 2);

        redo();

        expect(onRedo).toHaveBeenCalledTimes(1);
        expect(onRedo).toHaveBeenCalledWith(2, 1);

        dispose();
      });

      wrapReactive(() => {
        const onUndo = vitest.fn();
        const onRedo = vitest.fn();

        const [_, setValue, { undo, redo, registerCallback, dispose }] =
          createSignalWithHistory<number | undefined>(undefined);

        registerCallback("undo", onUndo);
        registerCallback("redo", onRedo);

        setValue(1);
        setValue(2);

        undo();

        expect(onUndo).toHaveBeenCalledTimes(1);
        expect(onUndo).toHaveBeenCalledWith(1, 2);

        undo();

        expect(onUndo).toHaveBeenCalledTimes(1);

        redo();

        expect(onRedo).toHaveBeenCalledTimes(1);
        expect(onRedo).toHaveBeenCalledWith(2, 1);

        redo();

        expect(onRedo).toHaveBeenCalledTimes(1);

        dispose();
      });
    });

    it("should work in edge cases", () => {
      wrapReactive(() => {
        const onUndo = vitest.fn();
        const onRedo = vitest.fn();

        const [_, _1, { undo, redo, registerCallback, dispose }] =
          createSignalWithHistory<number | undefined>(undefined);

        registerCallback("undo", onUndo);
        registerCallback("redo", onRedo);

        undo();

        expect(onUndo).toHaveBeenCalledTimes(0);

        redo();

        expect(onRedo).toHaveBeenCalledTimes(0);

        dispose();
      });

      wrapReactive(() => {
        const onUndo = vitest.fn();
        const onRedo = vitest.fn();

        const [_, setValue, { undo, registerCallback, dispose }] =
          createSignalWithHistory<number | undefined>(undefined);

        registerCallback("undo", onUndo);
        registerCallback("redo", onRedo);

        undo();

        expect(onUndo).toHaveBeenCalledTimes(0);

        setValue(2);

        undo();
        undo();

        expect(onUndo).toHaveBeenCalledTimes(0);

        dispose();
      });
    });
  });
});

describe("toArray methods", () => {
  describe("toArray", () => {
    it("should work correctly", () => {
      wrapReactive(() => {
        const [value, setValue, { toArray }] = createSignalWithHistory();

        expect(toArray()).toEqual([]);
      });

      wrapReactive(() => {
        const [value, setValue, { toArray }] = createSignalWithHistory(1);

        expect(toArray()).toEqual([1]);
      });

      wrapReactive(() => {
        const [value, setValue, { toArray }] = createSignalWithHistory();

        expect(toArray()).toEqual([]);

        setValue(1);

        expect(toArray()).toEqual([1]);
      });

      wrapReactive(() => {
        const [value, setValue, { toArray, clear: clearHistory }] =
          createSignalWithHistory(1, { historyLength: 2 });

        expect(toArray()).toEqual([1]);

        setValue(1);
        setValue(2);
        setValue(3);

        expect(toArray()).toEqual([2, 3]);
      });

      wrapReactive(() => {
        const [value, setValue, { toArray, clear: clearHistory }] =
          createSignalWithHistory(1, {
            historyLength: 2,
            signalOptions: { equals: false },
          });

        expect(toArray()).toEqual([1]);

        setValue(1);
        setValue(1);
        setValue(1);

        expect(toArray()).toEqual([1, 1]);
      });

      wrapReactive(() => {
        const [value, setValue, { toArray, clear: clearHistory }] =
          createSignalWithHistory(1);

        expect(toArray()).toEqual([1]);

        clearHistory();

        expect(toArray()).toEqual([1]);
      });

      wrapReactive(() => {
        const [value, setValue, { toArray, clear: clearHistory }] =
          createSignalWithHistory(1);

        expect(toArray()).toEqual([1]);

        clearHistory(true);

        expect(toArray()).toEqual([]);
      });
    });
  });

  describe("toArraySignal", () => {
    it("should work correctly", () => {
      wrapReactive(() => {
        const fn = vitest.fn();

        const [value, setValue, { arraySignal, clear }] =
          createSignalWithHistory(1);

        createComputed(() => {
          const array = arraySignal();

          fn(array);
        });

        expect(fn).toBeCalledTimes(1);
        expect(fn).toBeCalledWith([1]);

        setValue(2);

        expect(fn).toBeCalledTimes(2);
        expect(fn).toBeCalledWith([1, 2]);

        clear();

        expect(fn).toBeCalledTimes(3);
        expect(fn).toBeCalledWith([2]);

        clear(true);

        expect(fn).toBeCalledTimes(4);
        expect(fn).toBeCalledWith([]);
      });
    });
  });
});
