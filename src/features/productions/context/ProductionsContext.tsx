"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import { useProductions } from "../hooks/use-productions";

const ProductionsContext =
  createContext<
    ReturnType<
      typeof useProductions
    > | null
  >(null);

interface ProductionsProviderProps {
  children: ReactNode;
}

export function ProductionsProvider({
  children,
}: ProductionsProviderProps) {
  const value =
    useProductions();

  return (
    <ProductionsContext.Provider
      value={value}
    >
      {children}
    </ProductionsContext.Provider>
  );
}

export function useProductionsContext() {
  const context =
    useContext(
      ProductionsContext
    );

  if (!context) {
    throw new Error(
      "useProductionsContext must be used inside ProductionsProvider."
    );
  }

  return context;
}