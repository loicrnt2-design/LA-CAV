"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ModerationError, reviewReport } from "@/lib/moderation";

export async function reviewAction(_: string | null, form: FormData): Promise<string | null> {
  const user = await currentUser();
  if (!user || user.role !== "admin") return "forbidden";
  const note = form.get("note");
  if (typeof note !== "string") return "invalid";
  try {
    reviewReport(db(), user.id, Number(form.get("id")), note);
  } catch (error) {
    if (error instanceof ModerationError) return error.code;
    throw error;
  }
  revalidatePath("/admin/reports");
  return "success";
}
