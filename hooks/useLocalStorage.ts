import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * A custom hook that syncs a `useState` with `window.localStorage`.
 *
 * This version is robust against race conditions and stale state by separating
 * the state update from the localStorage persistence. React's state setter is
 * returned directly, and a `useEffect` hook handles writing to localStorage
 * whenever the state changes.
 *
 * @param key The key to use in localStorage.
 * @param initialValue The initial value to use if nothing is in localStorage.
 * @returns A stateful value, and a function to update it.
 */
export function useLocalStorage<T,>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  // 1. Get the initial state from localStorage or use the initialValue.
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 2. Use a useEffect to update localStorage whenever storedValue changes.
  // This avoids the stale state issue by decoupling state updates from persistence.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // 3. Listen for changes in other tabs to keep state in sync.
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === key && e.newValue !== JSON.stringify(storedValue)) {
            try {
                setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
            } catch (error) {
                console.error(`Error parsing storage change for key "${key}":`, error);
                setStoredValue(initialValue);
            }
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue, storedValue]);

  // 4. Return the state and the original setter from useState.
  // React's own setter correctly handles functional updates, preventing lost updates.
  return [storedValue, setStoredValue];
}