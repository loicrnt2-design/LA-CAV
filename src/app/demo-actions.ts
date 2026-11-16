"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDemoSupportRequest, cancelDemoOrder, createDemoOrder, DemoOrderError, type DeliveryMode } from "@/lib/demo-orders";

function failure(error: unknown): string {
  if (error instanceof DemoOrderError) return error.code;
  throw error;
}

export async function submitDemoOrder(_: string | null, form: FormData): Promise<string | null> {
  const user = await currentUser();
  if (!user) redirect("/login");
  let id: number;
  try {
    id = createDemoOrder(db(), {
      buyerId: user.id,
      listingId: Number(form.get("listingId")),
      requestKey: String(form.get("requestKey") ?? ""),
      mode: String(form.get("mode") ?? "") as DeliveryMode,
      expectedVersion: Number(form.get("version")),
      expectedTotalCents: Number(form.get("total")),
    });
  } catch (error) {
    return failure(error);
  }
  redirect(`/orders/${id}`);
}

export async function submitDemoSupport(_: string | null, form: FormData): Promise<string | null> {
  const user = await currentUser();
  if (!user) redirect("/login");
  const orderId = Number(form.get("orderId"));
  try {
    addDemoSupportRequest(db(), orderId, user.id, String(form.get("reason") ?? ""), String(form.get("message") ?? ""));
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/orders/${orderId}`);
  redirect(`/orders/${orderId}`);
}

export async function submitDemoCancellation(_: string | null, form: FormData): Promise<string | null> {
  const user = await currentUser();
  if (!user) redirect("/login");
  const orderId = Number(form.get("orderId"));
  try {
    cancelDemoOrder(db(), orderId, user.id);
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/orders/${orderId}`);
  redirect(`/orders/${orderId}`);
}
