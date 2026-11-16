import { db } from "./db";
import type Database from "better-sqlite3";

export const CATEGORIES = ["cards", "watches", "jewelry", "clothing", "furniture", "vintage", "collectibles"] as const;
export const CONDITIONS = ["new", "excellent", "good", "fair", "restore"] as const;

export interface ListingRow {
  id: number;
  shop_id: number;
  title: string;
  description: string;
  category: string;
  brand: string;
  condition: string;
  price_cents: number;
  shipping_cents: number | null;
  sale_mode: string;
  language: string;
  location: string;
  hand_delivery: number;
  status: string;
  image_hue: number;
  views: number;
  is_demo: number;
  created_at: string;
  shop_name: string;
  shop_slug: string;
  owner_id: number;
  cover_photo_id: number | null;
}

const BASE = `SELECT l.*, s.name AS shop_name, s.slug AS shop_slug, s.owner_id AS owner_id,
  (SELECT p.id FROM listing_photos p WHERE p.listing_id = l.id ORDER BY p.position LIMIT 1) AS cover_photo_id
  FROM listings l JOIN shops s ON s.id = l.shop_id`;

export interface Filters {
  q?: string;
  category?: string;
  condition?: string;
  brand?: string;
  location?: string;
  delivery?: "shipping" | "hand";
  maxPriceCents?: number;
  followerOf?: number;
  excludeHiddenFor?: number;
  shopId?: number;
  limit?: number;
  offset?: number;
}

export function searchListings(f: Filters, database: Database.Database = db()): ListingRow[] {
  const where = ["l.status IN ('published','sold')"];
  const args: unknown[] = [];
  if (f.q) {
    const like = `%${f.q.replace(/[%_]/g, "")}%`;
    where.push("(l.title LIKE ? OR l.brand LIKE ? OR l.description LIKE ?)");
    args.push(like, like, like);
  }
  if (f.category) { where.push("l.category = ?"); args.push(f.category); }
  if (f.condition) { where.push("l.condition = ?"); args.push(f.condition); }
  if (f.brand) {
    where.push("l.brand LIKE ? ESCAPE '\\'");
    args.push(`%${f.brand.replace(/[\\%_]/g, "\\$&")}%`);
  }
  if (f.location) {
    where.push("l.location LIKE ? ESCAPE '\\'");
    args.push(`%${f.location.replace(/[\\%_]/g, "\\$&")}%`);
  }
  if (f.delivery === "shipping") where.push("l.shipping_cents IS NOT NULL");
  if (f.delivery === "hand") where.push("l.hand_delivery = 1");
  if (f.maxPriceCents) { where.push("l.price_cents <= ?"); args.push(f.maxPriceCents); }
  if (f.shopId) { where.push("l.shop_id = ?"); args.push(f.shopId); }
  if (f.followerOf) { where.push("l.shop_id IN (SELECT shop_id FROM follows WHERE user_id = ?)"); args.push(f.followerOf); }
  if (f.excludeHiddenFor) { where.push("l.id NOT IN (SELECT listing_id FROM hidden WHERE user_id = ?)"); args.push(f.excludeHiddenFor); }
  const limit = Math.min(f.limit ?? 24, 60);
  const offset = Math.max(f.offset ?? 0, 0);
  // Vendus après disponibles ; puis fraîcheur.
  return database
    .prepare(`${BASE} WHERE ${where.join(" AND ")} ORDER BY (l.status = 'sold'), l.created_at DESC, l.id DESC LIMIT ? OFFSET ?`)
    .all(...args, limit, offset) as ListingRow[];
}

export function getListing(id: number): ListingRow | undefined {
  return db().prepare(`${BASE} WHERE l.id = ?`).get(id) as ListingRow | undefined;
}

export function listingsByOwner(userId: number): ListingRow[] {
  return db().prepare(`${BASE} WHERE s.owner_id = ? ORDER BY l.created_at DESC`).all(userId) as ListingRow[];
}

export function favoritesOf(userId: number): ListingRow[] {
  return db()
    .prepare(`${BASE} WHERE l.id IN (SELECT listing_id FROM favorites WHERE user_id = ?) ORDER BY l.created_at DESC`)
    .all(userId) as ListingRow[];
}

export function getShopBySlug(slug: string) {
  return db().prepare("SELECT * FROM shops WHERE slug = ?").get(slug) as
    | { id: number; owner_id: number; slug: string; name: string; description: string; seller_status: string; is_demo: number }
    | undefined;
}

export function getShopByOwner(userId: number) {
  return db().prepare("SELECT * FROM shops WHERE owner_id = ?").get(userId) as
    | { id: number; slug: string; name: string }
    | undefined;
}

export function slugify(s: string): string {
  return (
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) ||
    "boutique"
  );
}

export function uniqueSlug(base: string): string {
  const root = slugify(base);
  let slug = root;
  for (let i = 2; db().prepare("SELECT 1 FROM shops WHERE slug = ?").get(slug); i++) slug = `${root}-${i}`;
  return slug;
}
