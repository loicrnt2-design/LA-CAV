import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initializeDatabase } from "./db";
import { beginOnboarding, connectConfig, getConnectAccount, refreshConnectStatus, type ConnectGateway } from "./stripe-connect";

let database: Database.Database;
let gateway: ConnectGateway;

beforeEach(() => {
  database = new Database(":memory:");
  initializeDatabase(database);
  database.exec(`INSERT INTO users (id,email,password_hash,display_name) VALUES
    (1,'one@test.invalid','hash','One'), (2,'two@test.invalid','hash','Two')`);
  gateway = {
    platformId: vi.fn().mockResolvedValue("acct_platform"),
    createAccount: vi.fn().mockResolvedValue({ id: "acct_seller", details_submitted: false, payouts_enabled: false }),
    retrieveAccount: vi.fn().mockResolvedValue({ id: "acct_seller", details_submitted: true, payouts_enabled: true }),
    createLink: vi.fn().mockResolvedValue("https://connect.stripe.com/setup/test"),
  };
});

afterEach(() => database.close());

describe("Stripe Connect test onboarding", () => {
  it("is disabled by default, rejects live keys and validates the fixed return origin", () => {
    expect(connectConfig({})).toBeNull();
    const base = { PAYMENT_PROVIDER: "stripe_test", APP_BASE_URL: "http://localhost:3000", STRIPE_TEST_SECRET_KEY: "sk_test_example" };
    expect(connectConfig(base)?.origin).toBe("http://localhost:3000");
    for (const bad of [
      { ...base, STRIPE_TEST_SECRET_KEY: "sk_live_example" },
      { ...base, APP_BASE_URL: "http://example.com" },
      { ...base, APP_BASE_URL: "https://example.com/redirect" },
      { ...base, APP_BASE_URL: "https://user:pass@example.com" },
    ]) expect(() => connectConfig(bad)).toThrow("configuration");
  });

  it("saves an account once, then retrieves its status instead of recreating it", async () => {
    expect(await beginOnboarding(database, 1, gateway, "http://localhost:3000")).toBe("https://connect.stripe.com/setup/test");
    expect(getConnectAccount(database, 1)?.account_id).toBe("acct_seller");
    await beginOnboarding(database, 1, gateway, "http://localhost:3000");
    expect(gateway.createAccount).toHaveBeenCalledTimes(1);
    expect(getConnectAccount(database, 1)?.details_submitted).toBe(1);
    await refreshConnectStatus(database, 1, gateway);
    expect(getConnectAccount(database, 1)?.payouts_enabled).toBe(1);
    expect(getConnectAccount(database, 2)).toBeUndefined();
    await expect(refreshConnectStatus(database, 2, gateway)).rejects.toThrow("recovery");
  });

  it("reuses the persisted idempotency key after an uncertain API failure", async () => {
    vi.mocked(gateway.createAccount).mockRejectedValueOnce(new Error("network"));
    await expect(beginOnboarding(database, 1, gateway, "http://localhost:3000")).rejects.toThrow("network");
    const key = getConnectAccount(database, 1)?.create_key;
    await beginOnboarding(database, 1, gateway, "http://localhost:3000");
    expect(gateway.createAccount).toHaveBeenNthCalledWith(1, key);
    expect(gateway.createAccount).toHaveBeenNthCalledWith(2, key);
  });

  it("uses the same idempotency key for concurrent attempts", async () => {
    await Promise.all([
      beginOnboarding(database, 1, gateway, "http://localhost:3000"),
      beginOnboarding(database, 1, gateway, "http://localhost:3000"),
    ]);
    expect(vi.mocked(gateway.createAccount).mock.calls[0][0]).toBe(vi.mocked(gateway.createAccount).mock.calls[1][0]);
    expect(getConnectAccount(database, 1)?.account_id).toBe("acct_seller");
  });

  it("refuses uncertain old creations and a different Stripe platform", async () => {
    vi.mocked(gateway.createAccount).mockRejectedValueOnce(new Error("network"));
    await expect(beginOnboarding(database, 1, gateway, "http://localhost:3000")).rejects.toThrow("network");
    database.prepare("UPDATE stripe_test_accounts SET created_ms = ? WHERE user_id = 1").run(Date.now() - 24 * 60 * 60 * 1000);
    await expect(beginOnboarding(database, 1, gateway, "http://localhost:3000")).rejects.toThrow("recovery");
    expect(gateway.createAccount).toHaveBeenCalledTimes(1);
    vi.mocked(gateway.platformId).mockResolvedValue("acct_other");
    await expect(beginOnboarding(database, 1, gateway, "http://localhost:3000")).rejects.toThrow("platform");
  });

  it("rejects links outside Stripe and inconsistent account responses", async () => {
    vi.mocked(gateway.createLink).mockResolvedValue("https://connect.stripe.com.evil.example/link");
    await expect(beginOnboarding(database, 1, gateway, "http://localhost:3000")).rejects.toThrow("provider");
    vi.mocked(gateway.retrieveAccount).mockResolvedValue({ id: "acct_other", details_submitted: true, payouts_enabled: true });
    await expect(refreshConnectStatus(database, 1, gateway)).rejects.toThrow("provider");
  });
});
