import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

const DATABASE_NAME = "mm-closet-storage";
const STORE_NAME = "app-state";

type StoredRecord<T> = { key: string; value: T };

const openDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DATABASE_NAME, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "key" });
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const readRecord = async <T,>(key: string) => {
  const database = await openDatabase();
  return new Promise<T | undefined>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
    request.onsuccess = () => {
      database.close();
      resolve((request.result as StoredRecord<T> | undefined)?.value);
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
};

const writeRecord = async <T,>(key: string, value: T) => {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ key, value } satisfies StoredRecord<T>);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
};

/** Stores image-heavy state outside localStorage's small quota. */
export function useIndexedDbState<T>(key: string, initialValue: T, readLegacy?: () => T | undefined) {
  const [value, setValue] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);
  const initialValueRef = useRef(initialValue);
  const readLegacyRef = useRef(readLegacy);
  const valueRef = useRef(value);
  const readyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = await readRecord<T>(key);
        const legacyValue = stored === undefined ? readLegacyRef.current?.() : undefined;
        const nextValue = stored ?? legacyValue ?? initialValueRef.current;
        if (stored === undefined && legacyValue !== undefined) await writeRecord(key, legacyValue);
        if (!cancelled) {
          valueRef.current = nextValue;
          setValue(nextValue);
        }
      } catch {
        // IndexedDB is available in current Safari/Chrome. Keeping the in-memory state is safer than overwriting a legacy wardrobe.
      } finally {
        if (!cancelled) {
          readyRef.current = true;
          setReady(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [key]);

  const updateValue = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    const resolved = typeof next === "function" ? (next as (previous: T) => T)(valueRef.current) : next;
    valueRef.current = resolved;
    setValue(resolved);
    if (readyRef.current) void writeRecord(key, resolved);
  }, [key]);

  return [value, updateValue, ready] as const;
}
