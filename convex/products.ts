import { mutationGeneric, queryGeneric } from "convex/server";
import type { GenericId as Id } from "convex/values";
import { catalog, categorySlug, type Product } from "../app/store-data";
import { uniqueSlug } from "./utils";

type ProductRecord = {
  _id: Id<"products">;
  name: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  price: string;
  oldPrice?: string;
  brand?: string;
  seller?: string;
  rating?: string;
  reviews?: string;
  shipping?: string;
  discount?: string;
  image?: string;
  images?: string[];
  description?: string;
  specification?: string;
  quantity?: string;
  minQuantity?: string;
  badge?: string;
};

type ProductDocument = {
  _id: Id<"products">;
  name: string;
  slug: string;
  categorySlug: string;
  price: string;
  oldPrice?: string;
  brand?: string;
  seller?: string;
  rating?: string;
  reviews?: string;
  shipping?: string;
  discount?: string;
  image?: string;
  images?: string[];
  description?: string;
  specification?: string;
  quantity?: string;
  minQuantity?: string;
  badge?: string;
  createdAt: number;
  updatedAt: number;
};

type CategoryDocument = {
  slug: string;
  name: string;
};

type ProductInput = {
  name: string;
  categorySlug: string;
  price: string;
  oldPrice?: string;
  brand?: string;
  seller?: string;
  rating?: string;
  reviews?: string;
  shipping?: string;
  discount?: string;
  image?: string;
  images?: string[];
  description?: string;
  specification?: string;
  quantity?: string;
  minQuantity?: string;
  badge?: string;
};

function normalizeText(value: string, fallback = "") {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function toRecord(product: ProductDocument, categoryName: string): ProductRecord {
  return {
    ...product,
    categoryName,
  };
}

function enrichProducts(products: ProductDocument[], categories: CategoryDocument[]) {
  const categoryMap = new Map(categories.map((category) => [category.slug, category.name]));
  return products.map((product) => toRecord(product, categoryMap.get(product.categorySlug) ?? product.categorySlug));
}

function toSeedProduct(product: Product, categorySlugValue: string) {
  return {
    name: product.name,
    categorySlug: categorySlugValue,
    price: product.price,
    oldPrice: product.oldPrice,
    brand: product.brand,
    seller: product.seller,
    rating: product.rating,
    reviews: product.reviews,
    shipping: product.shipping,
    discount: product.discount,
    image: product.image,
    badge: product.badge,
  };
}

export const seedDefaults = mutationGeneric(async (ctx) => {
  const existing = await ctx.db.query("products").collect();
  if (existing.length > 0) {
    return { inserted: 0 };
  }

  const categories = await ctx.db.query("categories").collect();
  const slugByCategory = new Map(categories.map((category) => [category.name, category.slug]));
  const takenSlugs = new Set<string>();
  const now = Date.now();

  let inserted = 0;
  for (const [categoryName, items] of Object.entries(catalog)) {
    const resolvedSlug = slugByCategory.get(categoryName) ?? categorySlug(categoryName);
    for (const product of items) {
      const slug = uniqueSlug(`${resolvedSlug}-${product.name}`, [...takenSlugs]);
      takenSlugs.add(slug);

      await ctx.db.insert("products", {
        ...toSeedProduct(product, resolvedSlug),
        slug,
        createdAt: now,
        updatedAt: now,
      });
      inserted += 1;
    }
  }

  return { inserted };
});

export const getAll = queryGeneric(async (ctx): Promise<ProductRecord[]> => {
  const [products, categories] = await Promise.all([
    ctx.db.query("products").order("desc").collect(),
    ctx.db.query("categories").collect(),
  ]);

  return enrichProducts(products, categories);
});

export const getByCategory = queryGeneric(async (ctx, args: { categorySlug: string }): Promise<ProductRecord[]> => {
  const slug = normalizeText(args.categorySlug, "");
  if (!slug) {
    return [];
  }

  const [products, categories] = await Promise.all([
    ctx.db.query("products").withIndex("by_categorySlug", (q) => q.eq("categorySlug", slug)).collect(),
    ctx.db.query("categories").collect(),
  ]);

  return enrichProducts(products, categories);
});

export const getBySlug = queryGeneric(async (ctx, args: { slug: string }): Promise<ProductRecord | null> => {
  const slug = normalizeText(args.slug, "");
  if (!slug) {
    return null;
  }

  const [product, categories] = await Promise.all([
    ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", slug)).unique(),
    ctx.db.query("categories").collect(),
  ]);

  if (!product) {
    return null;
  }

  const categoryName = categories.find((category) => category.slug === product.categorySlug)?.name ?? product.categorySlug;
  return toRecord(product, categoryName);
});

export const create = mutationGeneric(async (ctx, args: ProductInput): Promise<ProductRecord> => {
  const name = normalizeText(args.name, "");
  if (!name) {
    throw new Error("Product name is required.");
  }

  const categorySlugValue = normalizeText(args.categorySlug, "");
  if (!categorySlugValue) {
    throw new Error("Category is required.");
  }

  const existing = await ctx.db.query("products").collect();
  const slug = uniqueSlug(`${categorySlugValue}-${name}`, existing.map((item) => item.slug));
  const now = Date.now();

  const id = await ctx.db.insert("products", {
    name,
    slug,
    categorySlug: categorySlugValue,
    price: normalizeText(args.price, "Rs. 0"),
    oldPrice: args.oldPrice?.trim() || undefined,
    brand: args.brand?.trim() || undefined,
    seller: args.seller?.trim() || undefined,
    rating: args.rating?.trim() || undefined,
    reviews: args.reviews?.trim() || undefined,
    shipping: args.shipping?.trim() || undefined,
    discount: args.discount?.trim() || undefined,
    image: args.image?.trim() || undefined,
    images: args.images?.length ? args.images : undefined,
    description: args.description?.trim() || undefined,
    specification: args.specification?.trim() || undefined,
    quantity: args.quantity?.trim() || undefined,
    minQuantity: args.minQuantity?.trim() || undefined,
    badge: args.badge?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  });

  const created = await ctx.db.get(id);
  if (!created) {
    throw new Error("Failed to create product.");
  }

  const categories = await ctx.db.query("categories").collect();
  const categoryName = categories.find((category) => category.slug === categorySlugValue)?.name ?? categorySlugValue;
  return toRecord(created, categoryName);
});

export const update = mutationGeneric(async (ctx, args: { id: Id<"products"> } & ProductInput): Promise<ProductRecord> => {
  const existing = await ctx.db.get(args.id);
  if (!existing) {
    throw new Error("Product not found.");
  }

  const name = normalizeText(args.name, existing.name);
  const categorySlugValue = normalizeText(args.categorySlug, existing.categorySlug);
  const slug = uniqueSlug(
    `${categorySlugValue}-${name}`,
    (await ctx.db.query("products").collect()).filter((item) => item._id !== args.id).map((item) => item.slug),
  );
  const now = Date.now();

  await ctx.db.patch(args.id, {
    name,
    slug,
    categorySlug: categorySlugValue,
    price: normalizeText(args.price, existing.price),
    oldPrice: args.oldPrice?.trim() || undefined,
    brand: args.brand?.trim() || undefined,
    seller: args.seller?.trim() || undefined,
    rating: args.rating?.trim() || undefined,
    reviews: args.reviews?.trim() || undefined,
    shipping: args.shipping?.trim() || undefined,
    discount: args.discount?.trim() || undefined,
    image: args.image?.trim() || undefined,
    images: args.images?.length ? args.images : undefined,
    description: args.description?.trim() || undefined,
    specification: args.specification?.trim() || undefined,
    quantity: args.quantity?.trim() || undefined,
    minQuantity: args.minQuantity?.trim() || undefined,
    badge: args.badge?.trim() || undefined,
    createdAt: existing.createdAt,
    updatedAt: now,
  });

  const updated = await ctx.db.get(args.id);
  if (!updated) {
    throw new Error("Failed to update product.");
  }

  const categories = await ctx.db.query("categories").collect();
  const categoryName = categories.find((category) => category.slug === categorySlugValue)?.name ?? categorySlugValue;
  return toRecord(updated, categoryName);
});

export const remove = mutationGeneric(async (ctx, args: { id: Id<"products"> }) => {
  await ctx.db.delete(args.id);
  return { deleted: true };
});
