"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addPhotos, assertPhotoOwner, movePhoto, PhotoError, processPhotos, removePhoto, selectedPhotos } from "@/lib/photos";

export async function uploadListingPhotos(_: string | null, form: FormData): Promise<string | null> {
  const user = await currentUser();
  if (!user) redirect("/login");
  const id = Number(form.get("listingId"));
  if (!Number.isSafeInteger(id) || id < 1) return "access";
  try {
    assertPhotoOwner(db(), id, user.id);
    const photos = await processPhotos(selectedPhotos(form));
    addPhotos(db(), id, user.id, photos);
  } catch (error) {
    if (error instanceof PhotoError) return error.code;
    throw error;
  }
  revalidatePath("/", "layout");
  redirect(`/listing/${id}/photos`);
}

export async function editListingPhoto(_: string | null, form: FormData): Promise<string | null> {
  const user = await currentUser();
  if (!user) redirect("/login");
  const id = Number(form.get("listingId"));
  const photoId = Number(form.get("photoId"));
  const operation = form.get("operation");
  if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(photoId) || photoId < 1 ||
      (operation !== "remove" && operation !== "previous" && operation !== "next")) return "access";
  try {
    if (operation === "remove") removePhoto(db(), id, user.id, photoId);
    else movePhoto(db(), id, user.id, photoId, operation);
  } catch (error) {
    if (error instanceof PhotoError) return error.code;
    throw error;
  }
  revalidatePath("/", "layout");
  redirect(`/listing/${id}/photos`);
}
