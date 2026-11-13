"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import type { Production } from "../types/production";

interface ProductionContextValue {
  production: Production | null;
  loading: boolean;
  updateProduction?: (
    updates: Partial<Production>
  ) => Promise<Production>;
}

const ProductionContext =
  createContext<ProductionContextValue | null>(
    null
  );

interface ProductionProviderProps {
  children: ReactNode;
  production: Production | null;
  loading: boolean;
  updateProduction?: (
    updates: Partial<Production>
  ) => Promise<Production>;
}

export function ProductionProvider({
  children,
  production,
  loading,
  updateProduction,
}: ProductionProviderProps) {
  return (
    <ProductionContext.Provider
      value={{
        production,
        loading,
        updateProduction,
      }}
    >
      {children}
    </ProductionContext.Provider>
  );
}

export function useProductionContext() {
  const context = useContext(
    ProductionContext
  );

  if (!context) {
    throw new Error(
      "useProductionContext must be used inside ProductionProvider."
    );
  }

  return context;
}