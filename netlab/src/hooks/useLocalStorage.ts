'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const SYNC_EVENT = 'netlab:storage';

type Updater<T> = T | ((prev: T) => T);

export function useLocalStorage<T>(key: string | null, initial: T): [T, (next: Updater<T>) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const initialRef = useRef(initial);

  useEffect(() => {
    if (!key) {
      setValue(initialRef.current);
      setReady(false);
      return;
    }
    const read = () => {
      try {
        const raw = window.localStorage.getItem(key);
        setValue(raw ? (JSON.parse(raw) as T) : initialRef.current);
      } catch {
        setValue(initialRef.current);
      }
    };
    read();
    setReady(true);
    const onSync = (e: Event) => {
      if ((e as CustomEvent<string>).detail === key) read();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) read();
    };
    window.addEventListener(SYNC_EVENT, onSync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, onSync);
      window.removeEventListener('storage', onStorage);
    };
  }, [key]);

  const update = useCallback(
    (next: Updater<T>) => {
      if (!key) return;
      let prev = initialRef.current;
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) prev = JSON.parse(raw) as T;
      } catch {
        prev = initialRef.current;
      }
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      if (Object.is(resolved, prev)) return;
      setValue(resolved);
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        return;
      }
      window.dispatchEvent(new CustomEvent<string>(SYNC_EVENT, { detail: key }));
    },
    [key],
  );

  return [value, update, ready];
}
