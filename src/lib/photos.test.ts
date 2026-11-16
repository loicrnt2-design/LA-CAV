import Database from "better-sqlite3";
import sharp from "sharp";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { initializeDatabase } from "./db";
import { addPhotos, getPhotoData, listPhotos, MAX_PHOTO_BYTES, movePhoto, processPhotos, removePhoto, selectedPhotos } from "./photos";

let database: Database.Database;
let jpeg: Buffer;
beforeEach(async () => {
  database = new Database(":memory:");
  initializeDatabase(database);
  database.exec(`
    INSERT INTO users (id,email,password_hash,display_name) VALUES (1,'seller@test.invalid','hash','seller'), (2,'other@test.invalid','hash','other');
    INSERT INTO shops (id,owner_id,slug,name) VALUES (1,1,'test','test');
    INSERT INTO listings (id,shop_id,title,description,category,condition,price_cents,status)
    VALUES (1,1,'Listing','description','cards','good',1000,'draft');
  `);
  jpeg = await sharp({ create: { width: 120, height: 80, channels: 3, background: "#c5a783" } })
    .jpeg().withMetadata({ orientation: 6 }).toBuffer();
});
afterEach(() => database.close());

function file(data: Uint8Array, name = "photo.jpg") {
  return new File([new Uint8Array(data)], name, { type: "image/jpeg" });
}

describe("listing photos", () => {
  it("recognizes empty file inputs while rejecting selected empty files", async () => {
    const form = new FormData();
    form.append("photos", new File([], "undefined", { type: "application/octet-stream" }));
    expect(selectedPhotos(form)).toEqual([]);
    form.set("photos", file(new Uint8Array(0)));
    await expect(processPhotos(selectedPhotos(form))).rejects.toThrow("size");
  });
  it("preserves the original privately and removes metadata from display images", async () => {
    const [photo] = await processPhotos([file(jpeg)]);
    expect(photo.original.equals(jpeg)).toBe(true);
    const metadata = await sharp(photo.display).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.exif).toBeUndefined();
    expect(metadata.orientation).toBeUndefined();
    expect(metadata.width).toBe(80);
    expect(metadata.height).toBe(120);
    expect((await sharp(photo.thumbnail).metadata()).exif).toBeUndefined();
  });
  it("rejects invalid formats, empty or oversized files, too many photos and excessive dimensions", async () => {
    await expect(processPhotos([file(new Uint8Array([0x3c, 0x73, 0x76, 0x67]))])).rejects.toThrow("format");
    await expect(processPhotos([file(new Uint8Array(0))])).rejects.toThrow("size");
    await expect(processPhotos([file(new Uint8Array(MAX_PHOTO_BYTES + 1))])).rejects.toThrow("size");
    await expect(processPhotos(Array.from({ length: 5 }, () => file(jpeg)))).rejects.toThrow("count");
    const large = await sharp({ create: { width: 4500, height: 4500, channels: 3, background: "#fff" } }).png().toBuffer();
    await expect(processPhotos([file(large, "large.png")])).rejects.toThrow("format");
  });
  it("isolates drafts and original files, even for published listings", async () => {
    const photos = await processPhotos([file(jpeg)]);
    addPhotos(database, 1, 1, photos);
    const id = listPhotos(database, 1)[0].id;
    expect(getPhotoData(database, id, null, "display")).toBeUndefined();
    expect(getPhotoData(database, id, 2, "thumbnail")).toBeUndefined();
    expect(getPhotoData(database, id, 1, "original")?.data.equals(jpeg)).toBe(true);
    database.prepare("UPDATE listings SET status='published' WHERE id=1").run();
    expect(getPhotoData(database, id, null, "display")?.mime).toBe("image/webp");
    expect(getPhotoData(database, id, 2, "original")).toBeUndefined();
    database.prepare("UPDATE listings SET status='archived' WHERE id=1").run();
    expect(getPhotoData(database, id, null, "display")).toBeUndefined();
  });
  it("enforces owner, maximum count, ordering and sold protection", async () => {
    const photos = await processPhotos([file(jpeg), file(jpeg), file(jpeg), file(jpeg)]);
    expect(() => addPhotos(database, 1, 2, photos)).toThrow("access");
    addPhotos(database, 1, 1, photos);
    const ids = listPhotos(database, 1).map((photo) => photo.id);
    expect(() => addPhotos(database, 1, 1, photos.slice(0, 1))).toThrow("count");
    expect(() => movePhoto(database, 1, 2, ids[1], "previous")).toThrow("access");
    movePhoto(database, 1, 1, ids[1], "previous");
    expect(listPhotos(database, 1).map((photo) => photo.id)).toEqual([ids[1], ids[0], ids[2], ids[3]]);
    expect(() => removePhoto(database, 1, 2, ids[0])).toThrow("access");
    removePhoto(database, 1, 1, ids[0]);
    expect(getPhotoData(database, ids[0], 1, "original")).toBeUndefined();
    database.prepare("UPDATE listings SET status='sold' WHERE id=1").run();
    expect(() => removePhoto(database, 1, 1, ids[1])).toThrow("unavailable");
  });
});
