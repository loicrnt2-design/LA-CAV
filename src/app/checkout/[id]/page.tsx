import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { demoQuote, getDemoListing, type DeliveryMode } from "@/lib/demo-orders";
import { demoErrors } from "@/lib/demo-labels";
import { formatMoney } from "@/lib/i18n";
import { getT } from "@/lib/locale";
import { DemoOrderForm } from "@/components/DemoForms";

export default async function Checkout({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const listingId = Number((await params).id);
  if (!Number.isSafeInteger(listingId) || listingId < 1) notFound();
  const listing = getDemoListing(db(), listingId);
  if (!listing || listing.is_demo !== 1 || listing.status !== "published" ||
      listing.sale_mode !== "fixed" || listing.owner_id === user.id) notFound();
  const requestedMode = (await searchParams).mode;
  const modes: DeliveryMode[] = [];
  if (listing.shipping_cents !== null) modes.push("shipping");
  if (listing.hand_delivery === 1) modes.push("hand");
  const { t, locale } = await getT();
  if (!modes.length || (requestedMode && !modes.includes(requestedMode as DeliveryMode))) {
    return <><h1>{t("demo.checkout")}</h1><p role="alert" className="notice">{t("demo.unavailable")}</p></>;
  }
  const mode = requestedMode === "hand" ? "hand" : modes[0];
  const quote = demoQuote(listing, mode);
  return <>
    <h1>{t("demo.checkout")}</h1>
    <p className="notice">{t("demo.warning")}</p>
    <h2>{listing.title}</h2>
    <h3>{t("demo.choose")}</h3>
    <div className="tabs">
      {modes.map((item) => <Link key={item} href={`/checkout/${listing.id}?mode=${item}`}
        aria-current={item === mode ? "page" : undefined}>{t(`demo.${item}`)}</Link>)}
    </div>
    <table className="sum"><tbody>
      <tr><td>{t("listing.price")}</td><td>{formatMoney(quote.priceCents, locale)}</td></tr>
      <tr><td>{t("listing.fee")}</td><td>{formatMoney(quote.feeCents, locale)}</td></tr>
      <tr><td>{t("listing.shipping")}</td><td>{formatMoney(quote.shippingCents, locale)}</td></tr>
      <tr className="total"><td>{t("listing.total")}</td><td>{formatMoney(quote.totalCents, locale)}</td></tr>
    </tbody></table>
    <p className="muted">{t("listing.demoRates")}</p>
    <DemoOrderForm listingId={listing.id} requestKey={randomUUID()} mode={mode}
      version={listing.version} total={quote.totalCents} submit={t("demo.confirm")} errors={demoErrors(t)} />
  </>;
}
