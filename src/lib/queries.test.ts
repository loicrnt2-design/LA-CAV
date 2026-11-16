import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initializeDatabase } from "./db";
import { searchListings } from "./queries";

let database: Database.Database;
beforeEach(() => {
  database = new Database(":memory:");
  initializeDatabase(database);
  database.exec(`
    INSERT INTO users (id,email,password_hash,display_name) VALUES (1,'seller@test.invalid','hash','seller');
    INSERT INTO shops (id,owner_id,slug,name) VALUES (1,1,'test','test');
    INSERT INTO listings (id,shop_id,title,description,category,condition,brand,location,price_cents,shipping_cents,hand_delivery,status) VALUES
      (1,1,'Watch','Description','watches','good','Acme','Paris 75',1000,0,1,'published'),
      (2,1,'Clock','Description','watches','good','ACME','Lyon 69',2000,NULL,1,'published'),
      (3,1,'Vase','Description','vintage','good','A_100%','Paris 75',3000,500,0,'published'),
      (4,1,'Draft','Description','watches','good','Acme','Paris 75',1000,0,1,'draft'),
      (5,1,'Sold','Description','watches','good','Acme','Paris 75',1000,0,1,'sold');
  `);
});
afterEach(() => database.close());

describe("listing search filters", () => {
  it("combines brand, location and delivery with the existing filters", () => {
    const ids = searchListings({ brand: "acme", location: "Paris", delivery: "shipping", category: "watches", maxPriceCents: 1500 }, database).map((listing) => listing.id);
    expect(ids).toEqual([1, 5]);
    expect(searchListings({ brand: "acme", location: "Lyon", delivery: "hand" }, database).map((listing) => listing.id)).toEqual([2]);
    expect(searchListings({ location: "Lyon", delivery: "shipping" }, database)).toEqual([]);
  });
  it("treats SQL wildcard characters literally and keeps drafts private", () => {
    expect(searchListings({ brand: "_100%" }, database).map((listing) => listing.id)).toEqual([3]);
    expect(searchListings({ brand: "%" }, database).map((listing) => listing.id)).toEqual([3]);
    expect(searchListings({ delivery: "hand" }, database).map((listing) => listing.id)).not.toContain(4);
  });
  it("uses the listed shipping amount, not the availability of a live carrier", () => {
    expect(searchListings({ delivery: "shipping" }, database).map((listing) => listing.id)).toEqual([3, 1, 5]);
    expect(searchListings({ delivery: "hand" }, database).map((listing) => listing.id)).toEqual([2, 1, 5]);
  });
});
