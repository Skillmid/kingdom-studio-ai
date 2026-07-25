"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

interface EditorContextValue {
  values: Record<string, unknown>;

  originalValues: Record<string, unknown>;

  setValue: (
    fieldId: string,
    value: unknown
  ) => void;

  reset(): void;

  isDirty: boolean;
}

const EditorContext =
  createContext<EditorContextValue | null>(
    null
  );

interface EditorProviderProps {
  initialValues: Record<string, unknown>;

  children: ReactNode;
}

export function EditorProvider({
  initialValues,
  children,
}: EditorProviderProps) {
  const [values, setValues] = useState(
    initialValues
  );

  const setValue = (
    fieldId: string,
    value: unknown
  ) => {
    setValues((previous) => ({
      ...previous,
      [fieldId]: value,
    }));
  };

  const reset = () => {
    setValues(initialValues);
  };

  const isDirty = useMemo(() => {
    return (
      JSON.stringify(values) !==
      JSON.stringify(initialValues)
    );
  }, [values, initialValues]);

  return (
    <EditorContext.Provider
      value={{
        values,
        originalValues: initialValues,
        setValue,
        reset,
        isDirty,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(
    EditorContext
  );

  if (!context) {
    throw new Error(
      "useEditor must be used inside EditorProvider."
    );
  }

  return context;
}