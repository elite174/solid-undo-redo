import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CustomLinkedList } from "./list";

describe("DoublyLinkedList", () => {
  let list: CustomLinkedList<number>;

  beforeEach(() => {
    list = new CustomLinkedList<number>(0);
  });

  afterEach(() => {
    list.destroy();
  });

  it("should add elements to the front of the list", () => {
    list.addFirst(1);
    list.addFirst(2);
    list.addFirst(3);

    expect(list.length()).toBe(4);
    expect(list.removeFirst()).toBe(3);
    expect(list.removeFirst()).toBe(2);
    expect(list.removeFirst()).toBe(1);
  });

  it("should add elements to the back of the list", () => {
    list.addLast(1);
    list.addLast(2);
    list.addLast(3);

    expect(list.length()).toBe(4);
    expect(list.removeLast()).toBe(3);
    expect(list.removeLast()).toBe(2);
    expect(list.removeLast()).toBe(1);
  });

  it("should remove elements from the front of the list", () => {
    list.addFirst(1);
    list.addFirst(2);
    list.addFirst(3);

    expect(list.length()).toBe(4);
    expect(list.removeFirst()).toBe(3);
    expect(list.length()).toBe(3);
    expect(list.removeFirst()).toBe(2);
    expect(list.length()).toBe(2);
    expect(list.removeFirst()).toBe(1);
    expect(list.length()).toBe(1);
  });

  it("should remove elements from the back of the list", () => {
    list.addLast(1);
    list.addLast(2);
    list.addLast(3);

    expect(list.length()).toBe(4);
    expect(list.removeLast()).toBe(3);
    expect(list.length()).toBe(3);
    expect(list.removeLast()).toBe(2);
    expect(list.length()).toBe(2);
    expect(list.removeLast()).toBe(1);
    expect(list.length()).toBe(1);
  });

  it("should check if a value is contained within the list", () => {
    list.addFirst(1);

    expect(list.contains(1)).toBeTruthy();
    expect(list.contains(-1)).toBeFalsy();
  });
});
