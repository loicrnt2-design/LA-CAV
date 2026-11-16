import { notFound } from "next/navigation";
import Link from "next/link";
import { getT } from "@/lib/locale";
import { currentUser } from "@/lib/auth";
import { getListing } from "@/lib/queries";
import { breakdown, PRICING_IS_DEMO } from "@/lib/pricing";
import { formatMoney } from "@/lib/i18n";
import { db } from "@/lib/db";
import { toggleFavorite } from "../../actions";
import { MessageForm } from "@/components/MessageForm";
import { ReportForm } from "@/components/ReportForm";
import { listPhotos } from "@/lib/photos";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = getListing(Number(id));
  const user = await currentUser();
  if (!l || (l.status !== "published" && l.status !== "sold" && l.owner_id !== user?.id)) notFound();
  const { t, locale } = await getT();
  if (l.status === "published" && l.owner_id !== user?.id) db().prepare("UPDATE listings SET views = views + 1 WHERE id = ?").run(l.id);
  const b = breakdown(l.price_cents, l.shipping_cents);
  const fav = user ? !!db().prepare("SELECT 1 FROM favorites WHERE user_id=? AND listing_id=?").get(user.id, l.id) : false;
  const photos = listPhotos(db(), l.id);
  return (
    <div className="detail">
      {photos.length > 0 ? <div className="photo-gallery" role="region" aria-label={t("photo.gallery")} tabIndex={0}>
        {photos.map((photo, index) => <figure key={photo.id}>
          <img src={`/photos/${photo.id}`} alt={`${l.title} — ${index + 1}`} loading={index === 0 ? "eager" : "lazy"} />
          {photos.length > 1 && <figcaption className="micro">{index + 1} / {photos.length}</figcaption>}
        </figure>)}
      </div> : <div className="ph">
        <span className="tag">{t(`cat.${l.category}`)}{l.is_demo ? ` · ${t("listing.demoBadge")}` : ""}</span>
        <span className="placeholder-label">{t("listing.noPhoto")}</span>
      </div>}
      <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
        <span className="micro">{t("listing.number")} · {l.id}</span>
        <h1 className="detail-title">{l.title}</h1>
        {user?.id === l.owner_id && l.status !== "sold" && <Link href={`/listing/${l.id}/photos`}>{t("photo.manage")}</Link>}
        <div className="price">{formatMoney(l.price_cents, locale)}</div>
        {l.status === "sold" && <span className="badge sold">{t("listing.sold")}</span>}
        <div className="muted">
          {t("listing.seller")} : <Link href={`/shop/${l.shop_slug}`}>{l.shop_name}</Link> · {t("listing.condition")} : {t(`cond.${l.condition}`)}
          {l.brand && ` · ${l.brand}`}{l.location && ` · ${l.location}`}
        </div>
        {l.hand_delivery ? <div className="badge">{t("listing.handDelivery")}</div> : null}
        <table className="sum">
          <tbody>
            <tr><td>{t("listing.price")}</td><td>{formatMoney(b.priceCents, locale)}</td></tr>
            <tr><td>{t("listing.fee")}</td><td>{formatMoney(b.feeCents, locale)}</td></tr>
            <tr><td>{t("listing.shipping")}</td><td>{b.shippingCents === null ? t("listing.shipping.tbd") : formatMoney(b.shippingCents, locale)}</td></tr>
            <tr className="total"><td>{t("listing.total")}</td><td>{b.totalCents === null ? t("listing.total.tbd") : formatMoney(b.totalCents, locale)}</td></tr>
          </tbody>
        </table>
        {PRICING_IS_DEMO && <p className="muted">{t("listing.demoRates")}</p>}
        <p style={{ whiteSpace: "pre-wrap" }}>{l.description}</p>
        <div className="row">
          <button className="btn disabled" disabled aria-describedby="buy-note">{t("listing.buy")}</button>
          <form action={toggleFavorite}>
            <input type="hidden" name="id" value={l.id} />
            <button className="btn ghost" type="submit" aria-pressed={fav}>{fav ? "♥" : "♡"} {t("listing.favorite")}</button>
          </form>
        </div>
        <p id="buy-note" className="notice">{t("listing.buy.disabled")}</p>
        {l.is_demo === 1 && l.status === "published" && l.sale_mode === "fixed" &&
          (l.shipping_cents !== null || l.hand_delivery === 1) && user?.id !== l.owner_id && (
            <p><Link className="btn ghost" href={`/checkout/${l.id}`}>{t("demo.open")}</Link></p>
          )}
        {user?.id !== l.owner_id && <MessageForm listingId={l.id} label={t("listing.contact")} send={t("messages.send")} />}
        {(l.status === "published" || l.status === "sold") && <details>
          <summary className="muted">{t("listing.report")}</summary>
          <ReportForm listingId={l.id} label={t("listing.report")} success={t("report.success")}
            invalid={t("report.invalid")} unavailable={t("report.unavailable")} />
        </details>}
      </div>
    </div>
  );
}
