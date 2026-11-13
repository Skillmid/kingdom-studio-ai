import { getCurrentUser } from "@/services/auth/auth";

import { productionRepository } from "../repositories/production.repository";

import { createProductionSchema } from "../validation/production.schema";

import { createProductionSlug, createWithUniqueSlug } from "./production-slug";

export async function createProduction(title: string) {
  const {
    data: { user },
  } = await getCurrentUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  // Validate once up front; each attempt only swaps the random slug suffix.
  const dto = createProductionSchema.parse({
    owner_id: user.id,
    created_by: user.id,
    title,
    slug: createProductionSlug(title),
  });

  return createWithUniqueSlug(title, (slug) => productionRepository.create({ ...dto, slug }));
}