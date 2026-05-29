import { queryGeneric, mutationGeneric } from "convex/server";
import type { GenericId as Id } from "convex/values";
import { categories as defaultCategories, categorySlug } from "../app/store-data";

type CategoryInput = {
  name: string;
  tagline: string;
  accent: string;
  image: string;
};

type CategoryRecord = {
  _id: Id<"categories">;
  name: string;
  slug: string;
  tagline: string;
  accent: string;
  image: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
};

function toDocument(category: (typeof defaultCategories)[number], isDefault: boolean, now: number) {
  return {
    name: category.label,
    slug: categorySlug(category.label),
    tagline: category.tagline,
    accent: category.accent,
    image: category.image,
    isDefault,
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeText(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export const seedDefaults = mutationGeneric(async (ctx) => {
  const existing = await ctx.db.query("categories").collect();
  if (existing.length > 0) {
    return { inserted: 0 };
  }

  const now = Date.now();
  for (const category of defaultCategories) {
    await ctx.db.insert("categories", toDocument(category, true, now));
  }

  return { inserted: defaultCategories.length };
});

export const getAll = queryGeneric(async (ctx): Promise<CategoryRecord[]> => {
  const rows = await ctx.db.query("categories").collect();
  return rows.sort((a, b) => a.name.localeCompare(b.name));
});

export const getBySlug = queryGeneric(async (ctx, args: { slug: string }): Promise<CategoryRecord | null> => {
  const slug = normalizeText(args.slug, "");
  if (!slug) {
    return null;
  }

  const row = await ctx.db.query("categories").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
  if (row) {
    return row;
  }

  const fallback = defaultCategories.find((category) => categorySlug(category.label) === slug);
  if (!fallback) {
    return null;
  }

  const now = Date.now();
  return {
    _id: `fallback-${slug}` as Id<"categories">,
    ...toDocument(fallback, true, now),
  };
});

export const create = mutationGeneric(async (ctx, args: CategoryInput): Promise<CategoryRecord> => {
  const name = normalizeText(args.name, "");
  if (!name) {
    throw new Error("Category name is required.");
  }

  const slug = categorySlug(name);
  const existing = await ctx.db.query("categories").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
  if (existing) {
    return existing;
  }

  const now = Date.now();
  const row = {
    name,
    slug,
    tagline: normalizeText(args.tagline, "New category created from admin"),
    accent: normalizeText(args.accent, "from-[#ecf4ff] to-[#d7e8ff]"),
    image: normalizeText(args.image, "/banners/poco-banner.svg"),
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };

  const id = await ctx.db.insert("categories", row);
  return { _id: id, ...row };
});

export const update = mutationGeneric(async (ctx, args: { id: Id<"categories">; name: string; tagline: string; accent: string; image: string }): Promise<CategoryRecord> => {
  const existing = await ctx.db.get(args.id);
  if (!existing) {
    throw new Error("Category not found.");
  }

  const name = normalizeText(args.name, existing.name);
  const slug = categorySlug(name);
  const conflict = await ctx.db.query("categories").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
  if (conflict && conflict._id !== existing._id) {
    throw new Error("Another category already uses that name.");
  }

  const nextDoc = {
    name,
    slug,
    tagline: normalizeText(args.tagline, existing.tagline),
    accent: normalizeText(args.accent, existing.accent),
    image: normalizeText(args.image, existing.image),
    isDefault: existing.isDefault,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  };

  await ctx.db.patch(existing._id, nextDoc);
  return { _id: existing._id, ...nextDoc };
});

export const remove = mutationGeneric(async (ctx, args: { id: Id<"categories"> }) => {
  const existing = await ctx.db.get(args.id);
  if (!existing) {
    return { deleted: false };
  }

  await ctx.db.delete(args.id);
  return { deleted: true };
});
