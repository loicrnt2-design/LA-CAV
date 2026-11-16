import Database from "better-sqlite3";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { initializeDatabase } from "./db";
import { addDemoSupportRequest, cancelDemoOrder, createDemoOrder, demoQuote, getDemoListing, getDemoOrder } from "./demo-orders";

let database: Database.Database;
const key = "ddba5f20-c5ec-4f4d-a5af-e7a29a69b404";
const input = { buyerId: 2, listingId: 1, requestKey: key, mode: "shipping" as const, expectedVersion: 1, expectedTotalCents: 5620 };

beforeEach(() => {
  database = new Database(":memory:");
  initializeDatabase(database);
  database.exec(`
    INSERT INTO users (id, email, password_hash, display_name) VALUES
      (1,'seller@example.test','hash','seller'), (2,'buyer@example.test','hash','buyer'), (3,'other@example.test','hash','other');
    INSERT INTO shops (id, owner_id, slug, name) VALUES (1,1,'test','test');
    INSERT INTO listings (id,shop_id,title,description,category,condition,price_cents,shipping_cents,hand_delivery,status,is_demo)
      VALUES (1,1,'Demo','Description','cards','good',5000,300,1,'published',1);
  `);
});
afterEach(() => database.close());

describe("isolated order simulation", () => {
  it("calculates shipping and hand delivery without changing listing stock", () => {
    const listing = getDemoListing(database, 1)!;
    expect(demoQuote(listing, "shipping").totalCents).toBe(5620);
    expect(demoQuote(listing, "hand").totalCents).toBe(5320);
    const id = createDemoOrder(database, input);
    expect(getDemoOrder(database, id, 2)).toMatchObject({
      price_cents: 5000, fee_cents: 320, shipping_cents: 300, total_cents: 5620, status: "simulated",
    });
    expect(getDemoListing(database, 1)?.status).toBe("published");
  });
  it("is idempotent and rejects a reused key with different inputs", () => {
    const id = createDemoOrder(database, input);
    expect(createDemoOrder(database, input)).toBe(id);
    expect(() => createDemoOrder(database, { ...input, mode: "hand", expectedTotalCents: 5320 })).toThrow("invalid");
    expect(database.prepare("SELECT COUNT(*) AS n FROM demo_orders").get()).toEqual({ n: 1 });
  });
  it("rejects real, sold, own, changed and unavailable listings", () => {
    database.prepare("UPDATE listings SET is_demo = 0").run();
    expect(() => createDemoOrder(database, input)).toThrow("unavailable");
    database.prepare("UPDATE listings SET is_demo = 1, status = 'sold'").run();
    expect(() => createDemoOrder(database, input)).toThrow("unavailable");
    database.prepare("UPDATE listings SET status = 'published', version = 2").run();
    expect(() => createDemoOrder(database, input)).toThrow("changed");
    database.prepare("UPDATE listings SET version = 1, shipping_cents = NULL").run();
    expect(() => createDemoOrder(database, input)).toThrow("unavailable");
    expect(() => createDemoOrder(database, { ...input, buyerId: 1 })).toThrow("unavailable");
  });
  it("rejects an altered total and invalid request", () => {
    expect(() => createDemoOrder(database, { ...input, expectedTotalCents: 1 })).toThrow("changed");
    expect(() => createDemoOrder(database, { ...input, requestKey: "bad" })).toThrow("invalid");
  });
  it("isolates history, cancellation and support by buyer", () => {
    const id = createDemoOrder(database, input);
    expect(getDemoOrder(database, id, 3)).toBeUndefined();
    expect(() => cancelDemoOrder(database, id, 3)).toThrow("not_found");
    expect(() => addDemoSupportRequest(database, id, 3, "return", "Test")).toThrow("not_found");
    expect(() => addDemoSupportRequest(database, id, 2, "wrong", "Test")).toThrow("invalid");
    addDemoSupportRequest(database, id, 2, "return", "Demande fictive");
    expect(database.prepare("SELECT reason, message FROM demo_support_requests").get()).toEqual({ reason: "return", message: "Demande fictive" });
    cancelDemoOrder(database, id, 2);
    expect(getDemoOrder(database, id, 2)?.status).toBe("cancelled");
    expect(() => cancelDemoOrder(database, id, 2)).toThrow("not_found");
  });
});
