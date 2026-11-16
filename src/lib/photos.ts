import type Database from "better-sqlite3";
import sharp from "sharp";

export const MAX_PHOTOS = 4;
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const MAX_PIXELS = 20_000_000;

export class PhotoError extends Error {
  constructor(public readonly code: "count" | "size" | "format" | "access" | "unavailable") {
    super(code);
  }
}

export interface ProcessedPhoto {
  original: Buffer;
  originalMime: "image/jpeg" | "image/png" | "image/webp";
  display: Buffer;
  thumbnail: Buffer;
}

export interface PhotoInfo { id: number; position: number }

function identifyImage(data: Buffer): ProcessedPhoto["originalMime"] | null {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (data.length >= 12 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function processPhotos(files: File[]): Promise<ProcessedPhoto[]> {
  if (files.length > MAX_PHOTOS) throw new PhotoError("count");
  const result: ProcessedPhoto[] = [];
  for (const file of files) {
    if (file.size < 1 || file.size > MAX_PHOTO_BYTES) throw new PhotoError("size");
    const original = Buffer.from(await file.arrayBuffer());
    const originalMime = identifyImage(original);
    if (!originalMime) throw new PhotoError("format");
    try {
      const image = sharp(original, { limitInputPixels: MAX_PIXELS, failOn: "warning", animated: true });
      const metadata = await image.metadata();
      const expected = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" }[originalMime];
      if (metadata.format !== expected || !metadata.width || !metadata.height || (metadata.pages ?? 1) !== 1) {
        throw new PhotoError("format");
      }
      const display = await image.rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 }).toBuffer();
      const thumbnail = await sharp(display).resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 78 }).toBuffer();
      result.push({ original, originalMime, display, thumbnail });
    } catch (error) {
      if (error instanceof PhotoError) throw error;
      if (error instanceof Error) {
        console.warn("Photo decoding rejected:", error.message);
        throw new PhotoError("format");
      }
      throw error;
    }
  }
  return result;
}

export function selectedPhotos(form: FormData): File[] {
  const entries = form.getAll("photos");
  if (entries.some((entry) => typeof entry === "string")) throw new PhotoError("format");
  // Next.js can decode an unselected file input with the literal name "undefined".
  return entries.filter((entry): entry is File => typeof entry !== "string" &&
    !(entry.size === 0 && (entry.name === "" || (entry.name === "undefined" && entry.type === "application/octet-stream"))));
}

export function assertPhotoOwner(database: Database.Database, listingId: number, ownerId: number): void {
  const listing = database.prepare(`SELECT l.status FROM listings l
    JOIN shops s ON s.id = l.shop_id WHERE l.id = ? AND s.owner_id = ?`).get(listingId, ownerId) as { status: string } | undefined;
  if (!listing) throw new PhotoError("access");
  if (listing.status === "sold") throw new PhotoError("unavailable");
}

export function listPhotos(database: Database.Database, listingId: number): PhotoInfo[] {
  return database.prepare("SELECT id, position FROM listing_photos WHERE listing_id = ? ORDER BY position").all(listingId) as PhotoInfo[];
}

export function addPhotos(database: Database.Database, listingId: number, ownerId: number, photos: ProcessedPhoto[]): void {
  database.transaction(() => {
    assertPhotoOwner(database, listingId, ownerId);
    const existing = listPhotos(database, listingId);
    if (photos.length === 0 || existing.length + photos.length > MAX_PHOTOS) throw new PhotoError("count");
    const insert = database.prepare("INSERT INTO listing_photos (listing_id, position, original, original_mime, display, thumbnail) VALUES (?, ?, ?, ?, ?, ?)");
    let position = existing.length ? existing[existing.length - 1].position + 1 : 0;
    for (const photo of photos) insert.run(listingId, position++, photo.original, photo.originalMime, photo.display, photo.thumbnail);
    database.prepare("UPDATE listings SET version = version + 1, updated_at = datetime('now') WHERE id = ?").run(listingId);
  }).immediate();
}

export function removePhoto(database: Database.Database, listingId: number, ownerId: number, photoId: number): void {
  database.transaction(() => {
    assertPhotoOwner(database, listingId, ownerId);
    const result = database.prepare("DELETE FROM listing_photos WHERE id = ? AND listing_id = ?").run(photoId, listingId);
    if (result.changes !== 1) throw new PhotoError("access");
    database.prepare("UPDATE listings SET version = version + 1, updated_at = datetime('now') WHERE id = ?").run(listingId);
  }).immediate();
}

export function movePhoto(database: Database.Database, listingId: number, ownerId: number, photoId: number, direction: "previous" | "next"): void {
  database.transaction(() => {
    assertPhotoOwner(database, listingId, ownerId);
    const photos = listPhotos(database, listingId);
    const index = photos.findIndex((photo) => photo.id === photoId);
    if (index < 0) throw new PhotoError("access");
    const other = photos[index + (direction === "previous" ? -1 : 1)];
    if (!other) throw new PhotoError("unavailable");
    const current = photos[index];
    const update = database.prepare("UPDATE listing_photos SET position = ? WHERE id = ?");
    update.run(-1, current.id);
    update.run(current.position, other.id);
    update.run(other.position, current.id);
    database.prepare("UPDATE listings SET version = version + 1, updated_at = datetime('now') WHERE id = ?").run(listingId);
  }).immediate();
}

export interface PhotoData { data: Buffer; mime: string }

export function getPhotoData(database: Database.Database, photoId: number, userId: number | null, variant: "original" | "thumbnail" | "display"): PhotoData | undefined {
  const photo = database.prepare(`SELECT
    CASE ? WHEN 'original' THEN p.original WHEN 'thumbnail' THEN p.thumbnail ELSE p.display END AS data,
    CASE WHEN ? = 'original' THEN p.original_mime ELSE 'image/webp' END AS mime
    FROM listing_photos p JOIN listings l ON l.id = p.listing_id JOIN shops s ON s.id = l.shop_id
    WHERE p.id = ? AND ((? = 'original' AND s.owner_id = ?) OR
      (? != 'original' AND (l.status IN ('published', 'sold') OR s.owner_id = ?)))`)
    .get(variant, variant, photoId, variant, userId, variant, userId) as PhotoData | undefined;
  return photo;
}
