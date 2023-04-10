import { Observable } from "./observable";

export class ListNode<T> {
  value: T;
  next: ListNode<T> | null;
  prev: ListNode<T> | null;

  constructor(value: T) {
    this.value = value;
    this.next = null;
    this.prev = null;
  }
}

const errorMessage = "A node doesn't exist";

type SubscribeFunction = (size: number) => void;

export class CustomLinkedList<
  T extends any = any
> extends Observable<SubscribeFunction> {
  private head: ListNode<T> | null;
  private tail: ListNode<T> | null;
  private size: number;

  constructor(value: T) {
    super();

    const node = new ListNode(value);

    this.head = node;
    this.tail = node;
    this.size = 1;
  }

  private triggerSubscriptions() {
    this.subscriptions.forEach((f) => f(this.length()));
  }

  length(): number {
    return this.size;
  }

  isEmpty(): boolean {
    return this.size === 0;
  }

  changeSize(term: number) {
    this.size += term;

    this.triggerSubscriptions();
  }

  contains(value: T): boolean {
    if (this.isEmpty()) return false;

    let current = this.head;

    while (current !== null) {
      if (current.value === value) return true;

      current = current.next;
    }

    return false;
  }

  addFirst(value: T) {
    const node = new ListNode(value);

    if (this.isEmpty()) {
      this.head = node;
      this.tail = node;
      this.changeSize(1);
      return;
    }

    if (!this.head) throw new Error(errorMessage);

    node.next = this.head;
    this.head.prev = node;
    this.head = node;

    this.changeSize(1);
  }

  addLast(value: T) {
    const node = new ListNode(value);

    if (this.isEmpty()) {
      this.head = node;
      this.tail = node;
      this.changeSize(1);
      return;
    }

    if (!this.tail) throw new Error(errorMessage);

    node.prev = this.tail;
    this.tail.next = node;
    this.tail = node;

    this.changeSize(1);
  }

  removeFirst() {
    if (this.isEmpty()) {
      return null;
    }

    if (!this.head) throw new Error(errorMessage);

    const valueToRemove = this.head.value;

    if (this.length() === 1) {
      this.head = null;
      this.tail = null;

      this.changeSize(-1);
      return valueToRemove;
    }

    const newHead = this.head.next;

    if (!newHead) throw new Error(errorMessage);

    newHead.prev = null;

    this.head.next = null;
    this.head = newHead;
    this.changeSize(-1);

    return valueToRemove;
  }

  getLastNode() {
    if (this.isEmpty()) return null;

    if (!this.tail) throw new Error(errorMessage);

    return this.tail;
  }

  removeLast(): T | null {
    if (this.isEmpty()) return null;

    if (!this.tail) throw new Error(errorMessage);

    const valueToRemove = this.tail.value;

    if (this.length() === 1) {
      this.head = null;
      this.tail = null;

      this.changeSize(-1);
      return valueToRemove;
    }

    const newTail = this.tail.prev;

    if (!newTail) throw new Error(errorMessage);

    newTail.next = null;
    this.tail.prev = null;
    this.tail = newTail;

    this.changeSize(-1);

    return valueToRemove;
  }
}
