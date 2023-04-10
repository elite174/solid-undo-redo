import { createRoot } from "solid-js";
import { describe, expect, it } from "vitest";

import { createTimeTravelSignal } from "./travel";

const wrapReactive = (fn: VoidFunction) => {
  const dispose = createRoot((dispose) => {
    fn();

    return dispose;
  });

  dispose();
};

describe("createTimeTravelSignal", () => {
  it("should be correctly initialized", () => {
    wrapReactive(() => {
      const [value, _, { size }] = createTimeTravelSignal(1);

      expect(value()).toBe(1);
      expect(size()).toBe(1);
    });
  });

  it("should set items correctly", () => {
    wrapReactive(() => {
      const [value, setValue] = createTimeTravelSignal(1);

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
        const [value, setValue, { size }] = createTimeTravelSignal(1);

        setValue(3);

        expect(value()).toBe(3);
        expect(size()).toBe(2);
      });
    });

    it("should not exceed the size", () => {
      wrapReactive(() => {
        const [value, setValue, { size }] = createTimeTravelSignal(1, {
          historyLength: 2,
        });

        setValue(3);

        expect(value()).toBe(3);
        expect(size()).toBe(2);

        setValue(4);

        expect(value()).toBe(4);
        expect(size()).toBe(2);
      });
    });
  });

  describe("undo method", () => {
    it("should correctly undo last value", () => {
      wrapReactive(() => {
        const [value, setValue, { undo }] = createTimeTravelSignal(1);

        setValue(2);

        expect(value()).toBe(2);

        undo();

        expect(value()).toBe(1);
      });
    });

    it("should trigger size accessor", () => {
      wrapReactive(() => {
        const [value, setValue, { undo, size }] = createTimeTravelSignal(1);

        setValue(5);

        expect(value()).toBe(5);
        expect(size()).toBe(2);

        undo();

        expect(value()).toBe(1);
        expect(size()).toBe(2);
      });
    });

    it("should work correctly with empty history", () => {
      wrapReactive(() => {
        const [value, setValue, { undo, size }] = createTimeTravelSignal(1);

        undo();

        expect(value()).toBe(1);
        expect(size()).toBe(1);
      });
    });
  });

  describe.only("clear method", () => {
    it.only("should work correctly", () => {
      wrapReactive(() => {
        const [value, setValue, { size, clear }] = createTimeTravelSignal(1);

        expect(value()).toBe(1);

        setValue(2);

        expect(value()).toBe(2);
        expect(size()).toBe(2);

        clear();

        expect(value()).toBe(2);
        expect(size()).toBe(1);
      });
    });
  });

  describe("redo function", () => {
    it("should work correctly", () => {
      wrapReactive(() => {
        const [value, setValue, { size, redo }] = createTimeTravelSignal(1);

        expect(value()).toBe(1);
        expect(size()).toBe(1);

        redo();

        expect(value()).toBe(1);
        expect(size()).toBe(1);

        setValue(2);

        expect(value()).toBe(2);
        expect(size()).toBe(2);
      });
    });

    it("should work correctly with undo", () => {
      wrapReactive(() => {
        const [value, setValue, { size, redo, undo }] =
          createTimeTravelSignal(1);

        expect(value()).toBe(1);
        expect(size()).toBe(1);

        undo();

        expect(value()).toBe(1);
        expect(size()).toBe(1);

        setValue(2);

        expect(value()).toBe(2);
        expect(size()).toBe(2);

        undo();

        expect(value()).toBe(1);
        expect(size()).toBe(2);

        redo();

        expect(value()).toBe(2);
        expect(size()).toBe(2);
      });
    });
  });

  describe("keepSameValues option", () => {
    it("should keep several same values if set to true", () => {
      wrapReactive(() => {
        const [_, setValue, { size }] = createTimeTravelSignal(1, {
          keepSameValues: true,
        });

        setValue(1);

        expect(size()).toBe(2);
      });
    });

    it("should not keep several same values if set to false", () => {
      wrapReactive(() => {
        const [_, setValue, { size }] = createTimeTravelSignal(1, {
          keepSameValues: false,
        });

        setValue(1);

        expect(size()).toBe(1);
      });
    });
  });
});
