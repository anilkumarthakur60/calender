export type EventListener<P> = (payload: P) => void;
export type Unsubscribe = () => void;

/** One registration. The same function may be registered multiple times. */
interface ListenerEntry {
  readonly fn: EventListener<unknown>;
}

/**
 * Typed pub/sub keyed by an event-map interface. Tiny, dependency-free, and
 * safe against listener mutation during emit (snapshots before iterating, and
 * skips entries removed mid-emit). A throwing listener is isolated: delivery
 * continues and the error is rethrown on a microtask.
 * Duplicate registrations of the same function are kept separately — each
 * unsubscribe removes only its own registration.
 */
export class EventBus<EventMap> {
  readonly #listeners: Map<keyof EventMap, ListenerEntry[]> = new Map();

  on<K extends keyof EventMap & string>(
    event: K,
    listener: EventListener<EventMap[K]>,
  ): Unsubscribe {
    let bucket = this.#listeners.get(event);
    if (!bucket) {
      bucket = [];
      this.#listeners.set(event, bucket);
    }
    const entry: ListenerEntry = { fn: listener as EventListener<unknown> };
    bucket.push(entry);
    return () => {
      const idx = bucket.indexOf(entry);
      if (idx !== -1) bucket.splice(idx, 1);
    };
  }

  emit<K extends keyof EventMap & string>(event: K, payload: EventMap[K]): void {
    const bucket = this.#listeners.get(event);
    if (!bucket || bucket.length === 0) return;
    for (const entry of [...bucket]) {
      // A listener that unsubscribed earlier in this same emit (a component
      // tearing down in its own handler) must not still be called.
      if (!bucket.includes(entry)) continue;
      try {
        (entry.fn as EventListener<EventMap[K]>)(payload);
      } catch (error) {
        // One faulty subscriber must not stop delivery to the rest, and must
        // not escape out of select()/focus() with state already committed.
        // Rethrow asynchronously so it still surfaces to error reporters.
        queueMicrotask(() => {
          throw error;
        });
      }
    }
  }

  clear(): void {
    this.#listeners.clear();
  }
}
