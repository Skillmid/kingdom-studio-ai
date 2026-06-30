import { getCurrentUser } from "@/services/auth/auth";

import { productionRepository } from "../repositories/production.repository";

import { createProductionSchema } from "../validation/production.schema";

function slugify(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createProduction(title: string) {
  const {
    data: { user },
  } = await getCurrentUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const dto = createProductionSchema.parse({
    owner_id: user.id,
    created_by: user.id,
    title,
    slug: slugify(title),
  });

  return productionRepository.create(dto);
}