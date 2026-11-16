import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/locale";
import { connectConfig, ConnectError, getConnectAccount } from "@/lib/stripe-connect";
import { ConnectForm } from "@/components/ConnectForm";

export default async function SellerPayments({ searchParams }: { searchParams: Promise<{ flow?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { t } = await getT();
  const { flow } = await searchParams;
  const account = getConnectAccount(db(), user.id);
  let configured = false;
  let invalidConfig = false;
  try {
    configured = connectConfig(process.env) !== null;
  } catch (error) {
    if (!(error instanceof ConnectError)) throw error;
    invalidConfig = true;
  }
  const errors = Object.fromEntries(["configuration", "platform", "recovery", "provider"].map((key) => [key, t(`connect.error.${key}`)]));
  return <>
    <p className="micro">{t("connect.eyebrow")}</p>
    <h1>{t("connect.title")}</h1>
    <p>{t("connect.intro")}</p>
    <p className="muted">{t("connect.warning")}</p>
    {flow === "return" && <p>{t("connect.return")}</p>}
    {flow === "refresh" && <p>{t("connect.expired")}</p>}
    {!configured ? <p role="status">{t(invalidConfig ? "connect.invalidConfig" : "connect.disabled")}</p> : <>
      {account?.account_id ? <>
        <p>{t("connect.checked")}: {account.checked_at ?? "—"}</p>
        <p>{t("connect.details")}: {t(account.details_submitted ? "connect.yes" : "connect.no")}</p>
        <p>{t("connect.payouts")}: {t(account.payouts_enabled ? "connect.yes" : "connect.no")}</p>
        <ConnectForm operation="refresh" label={t("connect.refresh")} errors={errors} />
      </> : <p>{t("connect.notStarted")}</p>}
      <ConnectForm operation="onboard" label={t(account?.account_id ? "connect.continue" : "connect.start")} errors={errors} />
    </>}
    <p><Link href="/account">{t("connect.back")}</Link></p>
  </>;
}
