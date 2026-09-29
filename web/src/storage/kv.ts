// ADR-009: user data lives in IndexedDB, never in the service-worker cache.
// One key-value store; values are structured clones, so no JSON round trip.

import { useSyncExternalStore } from "react";

const DB_NAME = "pasabi";
const STORE = "kv";

let opening: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return opening;
}

function run<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const tx = d.transaction(STORE, mode);
        const req = work(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req.result as T);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }),
  );
}

export function kvGet<T>(key: string): Promise<T | undefined> {
  return run<T | undefined>("readonly", (s) => s.get(key));
}

export function kvSet(key: string, value: unknown): Promise<void> {
  return run<unknown>("readwrite", (s) => s.put(value, key)).then(() => undefined);
}

/**
 * iOS may evict a web app's storage under pressure. Asking to persist is
 * the only lever a PWA has; the result is shown in Settings so nobody
 * believes their data is safer than it is (IMPLEMENTATION_PWA §6).
 */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/** A value the UI can subscribe to. Writers call set(); readers call use(). */
export interface Live<T> {
  get(): T;
  set(next: T): void;
  use(): T;
}

export function live<T>(initial: T): Live<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  return {
    get: () => value,
    set: (next) => {
      value = next;
      listeners.forEach((l) => l());
    },
    // use() is only ever called from components.
    use: () => useSyncExternalStore(subscribe, () => value),
  };
}
