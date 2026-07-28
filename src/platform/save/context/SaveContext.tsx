"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface SaveContextValue {
  saving: boolean;

  savedAt: Date | null;

  error: string | null;

  startSaving: () => void;

  finishSaving: () => void;

  failSaving: (
    message?: string
  ) => void;

  runSave: <T>(
    operation: () => Promise<T>
  ) => Promise<T>;
}

const SaveContext =
  createContext<SaveContextValue | null>(
    null
  );

interface SaveProviderProps {
  children: ReactNode;
}

export function SaveProvider({
  children,
}: SaveProviderProps) {
  const [saving, setSaving] =
    useState(false);

  const [savedAt, setSavedAt] =
    useState<Date | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const startSaving =
    useCallback(() => {
      setSaving(true);
      setError(null);
    }, []);

  const finishSaving =
    useCallback(() => {
      setSaving(false);
      setSavedAt(new Date());
      setError(null);
    }, []);

  const failSaving =
    useCallback(
      (
        message = "Unable to save."
      ) => {
        setSaving(false);
        setError(message);
      },
      []
    );

  const runSave =
    useCallback(
      async <T,>(
        operation: () => Promise<T>
      ): Promise<T> => {
        startSaving();

        try {
          const result =
            await operation();

          finishSaving();

          return result;
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to save.";

          failSaving(message);

          throw error;
        }
      },
      [
        startSaving,
        finishSaving,
        failSaving,
      ]
    );

  return (
    <SaveContext.Provider
      value={{
        saving,
        savedAt,
        error,
        startSaving,
        finishSaving,
        failSaving,
        runSave,
      }}
    >
      {children}
    </SaveContext.Provider>
  );
}

export function useSave() {
  const context =
    useContext(SaveContext);

  if (!context) {
    throw new Error(
      "useSave must be used inside SaveProvider."
    );
  }

  return context;
}