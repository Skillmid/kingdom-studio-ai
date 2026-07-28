import {
  buildProductionContext,
} from "../builders/context-builder";

import type {
  ProductionKnowledge,
} from "../types/production-knowledge";

export class ContextEngine {
  create(
    knowledge: ProductionKnowledge
  ) {
    return buildProductionContext(
      knowledge
    );
  }
}

export const contextEngine =
  new ContextEngine();