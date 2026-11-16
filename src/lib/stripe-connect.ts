import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import Stripe from "stripe";

export class ConnectError extends Error {
  constructor(public readonly code: "configuration" | "platform" | "recovery" | "provider") {
    super(code);
  }
}

export interface ConnectAccount {
  id: string;
  details_submitted: boolean;
  payouts_enabled: boolean;
}

export interface ConnectGateway {
  platformId(): Promise<string>;
  createAccount(key: string): Promise<ConnectAccount>;
  retrieveAccount(id: string): Promise<ConnectAccount>;
  createLink(id: string, origin: string): Promise<string>;
}

interface AccountRow {
  platform_id: string;
  create_key: string;
  created_ms: number;
  account_id: string | null;
  details_submitted: number | null;
  payouts_enabled: number | null;
  checked_at: string | null;
}

export function connectConfig(env: Record<string, string | undefined>): { key: string; origin: string } | null {
  if (env.PAYMENT_PROVIDER !== "stripe_test") return null;
  const key = env.STRIPE_TEST_SECRET_KEY ?? "";
  if (!/^(sk|rk)_test_[A-Za-z0-9_]+$/.test(key)) throw new ConnectError("configuration");
  let url: URL;
  try { url = new URL(env.APP_BASE_URL ?? ""); } catch { throw new ConnectError("configuration"); }
  const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !localHttp) || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash) throw new ConnectError("configuration");
  return { key, origin: url.origin };
}

export function stripeGateway(key: string): ConnectGateway {
  const stripe = new Stripe(key, { timeout: 20_000, maxNetworkRetries: 1 });
  return {
    async platformId() { return (await stripe.accounts.retrieve(null)).id; },
    async createAccount(key) {
      return stripe.accounts.create({ type: "express", country: "FR", capabilities: { transfers: { requested: true } } }, { idempotencyKey: key });
    },
    async retrieveAccount(id) { return stripe.accounts.retrieve(id); },
    async createLink(id, origin) {
      const link = await stripe.accountLinks.create({
        account: id, type: "account_onboarding",
        refresh_url: `${origin}/seller/payments?flow=refresh`,
        return_url: `${origin}/seller/payments?flow=return`,
      });
      return link.url;
    },
  };
}

export function getConnectAccount(database: Database.Database, userId: number): AccountRow | undefined {
  return database.prepare("SELECT * FROM stripe_test_accounts WHERE user_id = ?").get(userId) as AccountRow | undefined;
}

function saveStatus(database: Database.Database, userId: number, account: ConnectAccount): void {
  database.prepare(`UPDATE stripe_test_accounts SET details_submitted = ?, payouts_enabled = ?,
    checked_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE user_id = ?`)
    .run(Number(account.details_submitted), Number(account.payouts_enabled), userId);
}

async function connectedAccount(database: Database.Database, userId: number, gateway: ConnectGateway): Promise<ConnectAccount> {
  const platformId = await gateway.platformId();
  if (!platformId.startsWith("acct_")) throw new ConnectError("provider");
  database.prepare(`INSERT OR IGNORE INTO stripe_test_accounts (user_id, platform_id, create_key, created_ms)
    VALUES (?, ?, ?, ?)`).run(userId, platformId, randomUUID(), Date.now());
  const row = getConnectAccount(database, userId);
  if (!row) throw new ConnectError("provider");
  if (row.platform_id !== platformId) throw new ConnectError("platform");
  if (row.account_id) {
    const account = await gateway.retrieveAccount(row.account_id);
    if (account.id !== row.account_id) throw new ConnectError("provider");
    saveStatus(database, userId, account);
    return account;
  }
  // Stripe may discard idempotency keys after 24 hours; do not retry an uncertain creation indefinitely.
  if (Date.now() - row.created_ms >= 23 * 60 * 60 * 1000) throw new ConnectError("recovery");
  const account = await gateway.createAccount(row.create_key);
  if (!account.id.startsWith("acct_")) throw new ConnectError("provider");
  const saved = database.prepare("UPDATE stripe_test_accounts SET account_id = ? WHERE user_id = ? AND account_id IS NULL")
    .run(account.id, userId);
  if (!saved.changes && getConnectAccount(database, userId)?.account_id !== account.id) throw new ConnectError("recovery");
  saveStatus(database, userId, account);
  return account;
}

export async function beginOnboarding(database: Database.Database, userId: number, gateway: ConnectGateway, origin: string): Promise<string> {
  const account = await connectedAccount(database, userId, gateway);
  const raw = await gateway.createLink(account.id, origin);
  let url: URL;
  try { url = new URL(raw); } catch { throw new ConnectError("provider"); }
  if (url.protocol !== "https:" || url.hostname !== "connect.stripe.com" || url.username || url.password || url.port) {
    throw new ConnectError("provider");
  }
  return url.href;
}

export async function refreshConnectStatus(database: Database.Database, userId: number, gateway: ConnectGateway): Promise<void> {
  const row = getConnectAccount(database, userId);
  if (!row?.account_id) throw new ConnectError("recovery");
  if (await gateway.platformId() !== row.platform_id) throw new ConnectError("platform");
  const account = await gateway.retrieveAccount(row.account_id);
  if (account.id !== row.account_id) throw new ConnectError("provider");
  saveStatus(database, userId, account);
}
