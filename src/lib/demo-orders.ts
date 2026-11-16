import type Database from "better-sqlite3";
import { breakdown, DEMO_FEE_RULE } from "./pricing";

export type DeliveryMode = "shipping" | "hand";
export type SupportReason = "question" | "return" | "not_received" | "damaged" | "other";

export interface DemoOrder {
  id: number;
  buyer_id: number;
  listing_id: number;
  title: string;
  listing_version: number;
  price_cents: number;
  fee_cents: number;
  shipping_cents: number;
  total_cents: number;
  fee_rule: string;
  delivery_mode: DeliveryMode;
  status: "simulated" | "cancelled";
  created_at: string;
}

export interface DemoListing {
  id: number;
  title: string;
  price_cents: number;
  shipping_cents: number | null;
  hand_delivery: number;
  status: string;
  sale_mode: string;
  is_demo: number;
  version: number;
  owner_id: number;
}

export class DemoOrderError extends Error {
  constructor(public readonly code: "unavailable" | "changed" | "invalid" | "not_found") {
    super(code);
  }
}

export function getDemoListing(database: Database.Database, listingId: number): DemoListing | undefined {
  return database.prepare(`SELECT l.id, l.title, l.price_cents, l.shipping_cents, l.hand_delivery,
    l.status, l.sale_mode, l.is_demo, l.version, s.owner_id
    FROM listings l JOIN shops s ON s.id = l.shop_id WHERE l.id = ?`).get(listingId) as DemoListing | undefined;
}

export function demoQuote(listing: DemoListing, mode: DeliveryMode) {
  if (listing.is_demo !== 1 || listing.status !== "published" || listing.sale_mode !== "fixed") {
    throw new DemoOrderError("unavailable");
  }
  if (mode === "hand" && !listing.hand_delivery) throw new DemoOrderError("unavailable");
  if (mode === "shipping" && listing.shipping_cents === null) throw new DemoOrderError("unavailable");
  const shipping = mode === "hand" ? 0 : listing.shipping_cents;
  const quote = breakdown(listing.price_cents, shipping);
  if (shipping === null || quote.totalCents === null || !Number.isSafeInteger(shipping) || shipping < 0) {
    throw new DemoOrderError("invalid");
  }
  return { ...quote, shippingCents: shipping, totalCents: quote.totalCents };
}

export interface CreateDemoOrderInput {
  buyerId: number;
  listingId: number;
  requestKey: string;
  mode: DeliveryMode;
  expectedVersion: number;
  expectedTotalCents: number;
}

export function createDemoOrder(database: Database.Database, input: CreateDemoOrderInput): number {
  if (!Number.isSafeInteger(input.buyerId) || input.buyerId < 1 ||
      !Number.isSafeInteger(input.listingId) || input.listingId < 1 ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestKey) ||
      !["shipping", "hand"].includes(input.mode) ||
      !Number.isSafeInteger(input.expectedVersion) || !Number.isSafeInteger(input.expectedTotalCents)) {
    throw new DemoOrderError("invalid");
  }
  return database.transaction(() => {
    const existing = database.prepare("SELECT id, listing_id, delivery_mode, listing_version, total_cents FROM demo_orders WHERE buyer_id = ? AND request_key = ?")
      .get(input.buyerId, input.requestKey) as Pick<DemoOrder, "id" | "listing_id" | "delivery_mode" | "listing_version" | "total_cents"> | undefined;
    if (existing) {
      if (existing.listing_id !== input.listingId || existing.delivery_mode !== input.mode ||
          existing.listing_version !== input.expectedVersion || existing.total_cents !== input.expectedTotalCents) {
        throw new DemoOrderError("invalid");
      }
      return existing.id;
    }
    const listing = getDemoListing(database, input.listingId);
    if (!listing || listing.owner_id === input.buyerId) throw new DemoOrderError("unavailable");
    const quote = demoQuote(listing, input.mode);
    if (listing.version !== input.expectedVersion || quote.totalCents !== input.expectedTotalCents) {
      throw new DemoOrderError("changed");
    }
    const result = database.prepare(`INSERT INTO demo_orders
      (buyer_id, listing_id, request_key, listing_version, title, price_cents, fee_cents, shipping_cents, total_cents, fee_rule, delivery_mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      input.buyerId, listing.id, input.requestKey, listing.version, listing.title, quote.priceCents,
      quote.feeCents, quote.shippingCents, quote.totalCents, JSON.stringify(DEMO_FEE_RULE), input.mode,
    );
    return Number(result.lastInsertRowid);
  }).immediate();
}

export function getDemoOrder(database: Database.Database, orderId: number, buyerId: number): DemoOrder | undefined {
  return database.prepare("SELECT * FROM demo_orders WHERE id = ? AND buyer_id = ?").get(orderId, buyerId) as DemoOrder | undefined;
}

export function cancelDemoOrder(database: Database.Database, orderId: number, buyerId: number): void {
  const result = database.prepare("UPDATE demo_orders SET status = 'cancelled' WHERE id = ? AND buyer_id = ? AND status = 'simulated'")
    .run(orderId, buyerId);
  if (result.changes !== 1) throw new DemoOrderError("not_found");
}

export function addDemoSupportRequest(database: Database.Database, orderId: number, buyerId: number, reason: string, message: string): void {
  const cleanMessage = message.trim();
  if (!["question", "return", "not_received", "damaged", "other"].includes(reason) || cleanMessage.length < 3 || cleanMessage.length > 2000) {
    throw new DemoOrderError("invalid");
  }
  const order = getDemoOrder(database, orderId, buyerId);
  if (!order) throw new DemoOrderError("not_found");
  database.prepare("INSERT INTO demo_support_requests (order_id, buyer_id, reason, message) VALUES (?, ?, ?, ?)")
    .run(orderId, buyerId, reason, cleanMessage);
}
