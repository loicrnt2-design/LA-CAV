import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initializeDatabase } from "./db";
import { pendingReports, recentReviews, reviewReport, submitReport } from "./moderation";

let database: Database.Database;
beforeEach(() => {
  database = new Database(":memory:");
  initializeDatabase(database);
  database.exec(`
    INSERT INTO users (id,email,password_hash,display_name,role,is_demo) VALUES
      (1,'seller@test.invalid','hash','seller','user',0),
      (2,'admin@test.invalid','hash','admin','admin',0),
      (3,'demo@test.invalid','hash','demo','admin',1);
    INSERT INTO shops (id,owner_id,slug,name) VALUES (1,1,'test','test');
    INSERT INTO listings (id,shop_id,title,description,category,condition,price_cents,status) VALUES
      (1,1,'Public','description','cards','good',1000,'published'),
      (2,1,'Draft','description','cards','good',1000,'draft');
  `);
});
afterEach(() => database.close());

describe("report triage", () => {
  it("accepts reports only for public listings and validates their contents", () => {
    submitReport(database, 1, null, "  A concern  ");
    expect(pendingReports(database, 2)[0].reason).toBe("A concern");
    expect(() => submitReport(database, 2, 1, "private")).toThrow("unavailable");
    expect(() => submitReport(database, 99, 1, "missing")).toThrow("unavailable");
    expect(() => submitReport(database, 1, 1, "x")).toThrow("invalid");
    expect(() => submitReport(database, 1, 1, "x".repeat(501))).toThrow("invalid");
  });
  it("allows only non-demo administrators to read or review", () => {
    submitReport(database, 1, 1, "concern");
    for (const id of [1, 3, 99]) {
      expect(() => pendingReports(database, id)).toThrow("forbidden");
      expect(() => recentReviews(database, id)).toThrow("forbidden");
      expect(() => reviewReport(database, id, 1, "reviewed")).toThrow("forbidden");
    }
    expect(pendingReports(database, 2)).toHaveLength(1);
  });
  it("records one review with an internal note and does not change the listing", () => {
    submitReport(database, 1, null, "concern");
    expect(() => reviewReport(database, 2, 1, "  ")).toThrow("invalid");
    reviewReport(database, 2, 1, "  reviewed  ");
    expect(pendingReports(database, 2)).toHaveLength(0);
    expect(recentReviews(database, 2)[0]).toMatchObject({ id: 1, reviewer: "admin", note: "reviewed" });
    expect(() => reviewReport(database, 2, 1, "again")).toThrow("unavailable");
    expect(database.prepare("SELECT status FROM listings WHERE id = 1").get()).toEqual({ status: "published" });
  });
});
