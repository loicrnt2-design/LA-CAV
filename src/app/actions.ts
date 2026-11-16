"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, currentUser, destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { CATEGORIES, CONDITIONS, getListing, getShopByOwner, uniqueSlug } from "@/lib/queries";
import { parseEuroToCents } from "@/lib/pricing";
import { addPhotos, PhotoError, processPhotos, selectedPhotos } from "@/lib/photos";
import { ModerationError, submitReport } from "@/lib/moderation";

const TERMS_VERSION = "brouillon-0.1";

export async function setLanguage(formData: FormData) {
  const lang = String(formData.get("lang"));
  if (!isLocale(lang)) return;
  (await cookies()).set("lang", lang, { path: "/", maxAge: 365 * 86400, sameSite: "lax" });
  const u = await currentUser();
  if (u) db().prepare("UPDATE users SET locale = ? WHERE id = ?").run(lang, u.id);
  revalidatePath("/", "layout");
}

const registerSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(10).max(200),
  name: z.string().trim().min(2).max(60),
  terms: z.literal("on"),
});

export async function register(_: string | null, formData: FormData): Promise<string | null> {
  const p = registerSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) return "invalid";
  const email = p.data.email.toLowerCase();
  if (db().prepare("SELECT 1 FROM users WHERE email = ?").get(email)) return "invalid";
  const locale = (await cookies()).get("lang")?.value;
  const id = db()
    .prepare("INSERT INTO users (email, password_hash, display_name, locale) VALUES (?,?,?,?)")
    .run(email, await hashPassword(p.data.password), p.data.name, isLocale(locale) ? locale : null).lastInsertRowid as number;
  db().prepare("INSERT INTO terms_acceptances (user_id, document, version) VALUES (?, 'cgu', ?)").run(id, TERMS_VERSION);
  await createSession(id);
  redirect("/account");
}

export async function login(_: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const row = db().prepare("SELECT id, password_hash FROM users WHERE email = ? AND is_demo = 0").get(email) as
    | { id: number; password_hash: string }
    | undefined;
  const ok = row ? await verifyPassword(String(formData.get("password") ?? ""), row.password_hash) : false;
  if (!row || !ok) return "invalid";
  await createSession(row.id);
  redirect("/account");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

const listingSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  category: z.enum(CATEGORIES),
  condition: z.enum(CONDITIONS),
  brand: z.string().trim().max(60).default(""),
  location: z.string().trim().max(80).default(""),
});

export async function createListing(_: string | null, formData: FormData): Promise<string | null> {
  const user = await requireUser();
  const parsed = listingSchema.safeParse(Object.fromEntries(formData));
  const price = parseEuroToCents(String(formData.get("price") ?? ""));
  const shipRaw = String(formData.get("shipping") ?? "").trim();
  const ship = shipRaw === "" ? null : parseEuroToCents(shipRaw);
  if (!parsed.success || price === null || (shipRaw !== "" && ship === null)) return "invalid";
  let photos;
  try {
    photos = await processPhotos(selectedPhotos(formData));
  } catch (error) {
    if (error instanceof PhotoError) return `photo.${error.code}`;
    throw error;
  }
  const d = parsed.data;
  const status = formData.get("intent") === "draft" ? "draft" : "published";
  const lang = String((await cookies()).get("lang")?.value ?? "fr");
  const hue = Math.floor(Math.random() * 360);
  const database = db();
  const id = database.transaction(() => {
    let shop = getShopByOwner(user.id);
    if (!shop) {
      const slug = uniqueSlug(user.display_name);
      const shopId = Number(database.prepare("INSERT INTO shops (owner_id, slug, name) VALUES (?,?,?)")
        .run(user.id, slug, user.display_name).lastInsertRowid);
      shop = { id: shopId, slug, name: user.display_name };
    }
    const listingId = Number(database.prepare(
      `INSERT INTO listings (shop_id,title,description,category,brand,condition,price_cents,shipping_cents,status,language,location,hand_delivery,image_hue)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(shop.id, d.title, d.description, d.category, d.brand, d.condition, price, ship, status, isLocale(lang) ? lang : "fr", d.location, formData.get("hand") ? 1 : 0, hue).lastInsertRowid);
    if (photos.length) addPhotos(database, listingId, user.id, photos);
    return listingId;
  }).immediate();
  redirect(status === "published" ? `/listing/${id}` : "/account");
}

export async function setListingStatus(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["published", "draft", "archived"].includes(status)) return;
  const l = getListing(id);
  if (!l || l.owner_id !== user.id || l.status === "sold") return;
  db().prepare("UPDATE listings SET status = ?, version = version + 1, updated_at = datetime('now') WHERE id = ?").run(status, id);
  revalidatePath("/account");
}

export async function toggleFavorite(formData: FormData) {
  const user = await currentUser();
  const id = Number(formData.get("id"));
  if (!user) redirect("/login");
  if (!getListing(id)) return;
  const has = db().prepare("SELECT 1 FROM favorites WHERE user_id=? AND listing_id=?").get(user.id, id);
  if (has) db().prepare("DELETE FROM favorites WHERE user_id=? AND listing_id=?").run(user.id, id);
  else db().prepare("INSERT INTO favorites (user_id, listing_id) VALUES (?,?)").run(user.id, id);
  revalidatePath("/", "layout");
}

export async function toggleFollow(formData: FormData) {
  const user = await currentUser();
  const shopId = Number(formData.get("shopId"));
  if (!user) redirect("/login");
  const shop = db().prepare("SELECT owner_id FROM shops WHERE id = ?").get(shopId) as { owner_id: number } | undefined;
  if (!shop || shop.owner_id === user.id) return;
  const has = db().prepare("SELECT 1 FROM follows WHERE user_id=? AND shop_id=?").get(user.id, shopId);
  if (has) db().prepare("DELETE FROM follows WHERE user_id=? AND shop_id=?").run(user.id, shopId);
  else db().prepare("INSERT INTO follows (user_id, shop_id) VALUES (?,?)").run(user.id, shopId);
  revalidatePath("/", "layout");
}

export async function hideListing(formData: FormData) {
  const user = await currentUser();
  const id = Number(formData.get("id"));
  if (!user || !getListing(id)) return;
  db().prepare("INSERT OR IGNORE INTO hidden (user_id, listing_id) VALUES (?,?)").run(user.id, id);
  revalidatePath("/", "layout");
}

export async function resetHidden() {
  const user = await requireUser();
  db().prepare("DELETE FROM hidden WHERE user_id = ?").run(user.id);
  revalidatePath("/", "layout");
}

export async function reportListing(_: string | null, formData: FormData): Promise<string | null> {
  const user = await currentUser();
  const id = Number(formData.get("id"));
  const reason = formData.get("reason");
  if (typeof reason !== "string") return "invalid";
  try {
    submitReport(db(), id, user?.id ?? null, reason);
  } catch (error) {
    if (error instanceof ModerationError) return error.code;
    throw error;
  }
  revalidatePath(`/listing/${id}`);
  return "success";
}

export async function sendMessage(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const id = Number(formData.get("listingId"));
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  const l = getListing(id);
  if (!l || !body) return;
  let to = Number(formData.get("to")) || l.owner_id;
  if (user.id === l.owner_id) {
    const ok = db().prepare("SELECT 1 FROM messages WHERE listing_id=? AND (from_user=? OR to_user=?)").get(id, to, to);
    if (!ok) return;
  } else {
    to = l.owner_id;
  }
  if (to === user.id) return;
  const lang = String((await cookies()).get("lang")?.value ?? "") || null;
  db().prepare("INSERT INTO messages (listing_id, from_user, to_user, body, language) VALUES (?,?,?,?,?)").run(id, user.id, to, body, lang);
  revalidatePath("/messages");
  redirect(`/messages?l=${id}&with=${to}`);
}
