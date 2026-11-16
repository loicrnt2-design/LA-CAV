import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPhotoData } from "@/lib/photos";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) return new Response(null, { status: 404 });
  const original = new URL(request.url).searchParams.get("original") === "1";
  const thumbnail = new URL(request.url).searchParams.get("size") === "thumb";
  const user = await currentUser();
  const photo = getPhotoData(db(), id, user?.id ?? null, original ? "original" : thumbnail ? "thumbnail" : "display");
  if (!photo) return new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const headers = new Headers({
    "Content-Type": photo.mime,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (original) {
    const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[photo.mime];
    headers.set("Content-Disposition", `attachment; filename="la-cav-original-${id}.${extension}"`);
  }
  return new Response(new Uint8Array(photo.data), { headers });
}
