"use server";

import Stripe from "stripe";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { beginOnboarding, connectConfig, ConnectError, refreshConnectStatus, stripeGateway } from "@/lib/stripe-connect";

export async function connectAction(_: string | null, form: FormData): Promise<string | null> {
  const user = await currentUser();
  if (!user) redirect("/login");
  const operation = form.get("operation");
  if (operation !== "onboard" && operation !== "refresh") return "provider";
  let destination: string | null = null;
  try {
    const config = connectConfig(process.env);
    if (!config) return "configuration";
    const gateway = stripeGateway(config.key);
    if (operation === "onboard") destination = await beginOnboarding(db(), user.id, gateway, config.origin);
    else await refreshConnectStatus(db(), user.id, gateway);
  } catch (error) {
    if (error instanceof ConnectError) return error.code;
    if (error instanceof Stripe.errors.StripeError) {
      console.error("Stripe Connect test request failed:", error.type, error.code ?? "unknown");
      return "provider";
    }
    throw error;
  }
  revalidatePath("/seller/payments");
  if (destination) redirect(destination);
  redirect("/seller/payments");
}
