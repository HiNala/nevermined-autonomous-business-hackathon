"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Safe localStorage hook — handles SSR, JSON parse errors, and storage quota errors.
 * Falls back to the initialValue silently if localStorage is unavailable.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch {
      // localStorage unavailable (private browsing, iOS Safari quota, SSR)
    }
  }, [key]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Storage quota exceeded or unavailable — update state only
      }
      return next;
    });
  }, [key]);

  return [storedValue, setValue];
}
