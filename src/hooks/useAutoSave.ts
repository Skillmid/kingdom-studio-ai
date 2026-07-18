"use client";

import {
  useEffect,
  useRef,
} from "react";

interface UseAutoSaveOptions<T> {
  value: T;

  enabled?: boolean;

  delay?: number;

  onSave: (
    value: T
  ) => Promise<void>;
}

export function useAutoSave<T>({
  value,
  enabled = true,
  delay = 2000,
  onSave,
}: UseAutoSaveOptions<T>) {
  const firstRender =
    useRef(true);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const timer =
      setTimeout(() => {
        void onSave(value);
      }, delay);

    return () =>
      clearTimeout(timer);
  }, [
    value,
    enabled,
    delay,
    onSave,
  ]);
}