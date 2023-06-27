import { createRoot } from "solid-js";
import { describe, expect, it, vitest } from "vitest";

import { createUndoRedoSignal } from "./travel";

const wrapReactive = (fn: VoidFunction) => {
  const dispose = createRoot((dispose) => {
    fn();

    return dispose;
  });

  dispose();
};

describe("createUndoRedoSignal", () => {
  it("should be correctly initialized", () => {
    wrapReactive(() => {
      const [value, _, { isRedoPossible, isUndoPossible }] =
        createUndoRedoSignal(1);

      expect(value()).toBe(1);
      expect(isRedoPossible()).toBe(false);
      expect(isUndoPossible()).toBe(false);
    });
  });

  it("should set items correctly", () => {
    wrapReactive(() => {
      const [value, setValue] = createUndoRedoSignal(1);

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
        const [value, setValue, { isUndoPossible }] = createUndoRedoSignal(1);

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
          createUndoRedoSignal(1);

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
        const [value, _, { undo, isUndoPossible }] = createUndoRedoSignal(1);

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
          {
            undo,
            isRedoPossible,
            isUndoPossible,
            reactiveHistoryGenerator,
            size,
          },
        ] = createUndoRedoSignal(1, { historyLength: 3 });

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
        for (const item of reactiveHistoryGenerator()) history.push(item);

        expect(history).toStrictEqual([2, 3, 5]);
      });
    });
  });
});

describe("clearHistory method", () => {
  it("should work correctly", () => {
    wrapReactive(() => {
      const [
        value,
        setValue,
        { clearHistory, isUndoPossible, isRedoPossible, size },
      ] = createUndoRedoSignal(1);

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
});

describe("redo function", () => {
  it("should work correctly", () => {
    wrapReactive(() => {
      const [value, setValue, { redo, isRedoPossible }] =
        createUndoRedoSignal(1);

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
        createUndoRedoSignal(1);

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
      const [value, setValue, { isUndoPossible }] = createUndoRedoSignal(
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
      const [value, setValue, { isUndoPossible }] = createUndoRedoSignal(
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

describe.only("onUndo, onRedo callbacks", () => {
  it("should work correctly", () => {
    wrapReactive(() => {
      const onUndo = vitest.fn();
      const onRedo = vitest.fn();

      const [_, setValue, { undo, redo }] = createUndoRedoSignal<number>(1, {
        onUndo,
        onRedo,
      });

      setValue(2);

      undo();

      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(onUndo).toHaveBeenCalledWith(1, 2);

      redo();

      expect(onRedo).toHaveBeenCalledOnce();
      expect(onRedo).toHaveBeenCalledWith(2, 1);
    });
  });

  it("should work in edge cases", () => {
    wrapReactive(() => {
      const onUndo = vitest.fn();
      const onRedo = vitest.fn();

      const [_, _1, { undo, redo }] = createUndoRedoSignal<number>(1, {
        onUndo,
        onRedo,
      });

      undo();

      expect(onUndo).toHaveBeenCalledTimes(0);

      redo();

      expect(onRedo).toHaveBeenCalledTimes(0);
    });

    wrapReactive(() => {
      const onUndo = vitest.fn();
      const onRedo = vitest.fn();

      const [_, setValue, { undo }] = createUndoRedoSignal<number>(1, {
        onUndo,
        onRedo,
      });

      undo();

      expect(onUndo).toHaveBeenCalledTimes(0);

      setValue(2);

      undo();
      undo();

      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(onUndo).toHaveBeenCalledWith(1, 2);
    });
  });
});
