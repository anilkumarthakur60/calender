export type EventListener<P> = (payload: P) => void;
export type Unsubscribe = () => void;

/**
 * Typed pub/sub keyed by an event-map interface. Tiny, dependency-free, and
 * safe against listener mutation during emit (snapshots before iterating).
 */
export class EventBus<EventMap> {
  readonly #listeners: Map<keyof EventMap, Set<EventListener<unknown>>> = new Map();

  on<K extends keyof EventMap & string>(event: K, listener: EventListener<EventMap[K]>): Unsubscribe {
    let bucket = this.#listeners.get(event);
    if (!bucket) {
      bucket = new Set();
      this.#listeners.set(event, bucket);
    }
    bucket.add(listener as EventListener<unknown>);
    return () => {
      bucket?.delete(listener as EventListener<unknown>);
    };
  }

  emit<K extends keyof EventMap & string>(event: K, payload: EventMap[K]): void {
    const bucket = this.#listeners.get(event);
    if (!bucket || bucket.size === 0) return;
    for (const listener of [...bucket]) {
      (listener as EventListener<EventMap[K]>)(payload);
    }
  }

  clear(): void {
    this.#listeners.clear();
  }
}
