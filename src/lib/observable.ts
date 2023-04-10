export class Observable<T> {
  protected subscriptions: Set<T> = new Set();

  public subscribe(fn: T) {
    this.subscriptions.add(fn);
  }

  public unsubscribe(fn: T) {
    this.subscriptions.delete(fn);
  }
}
