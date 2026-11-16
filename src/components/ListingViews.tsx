import Link from "next/link";
import type { ListingRow } from "@/lib/queries";
import { breakdown } from "@/lib/pricing";
import { formatMoney, type Locale, type T } from "@/lib/i18n";
import { hideListing } from "@/app/actions";

function Photo({ l, t }: { l: ListingRow; t: T }) {
  if (l.cover_photo_id) return (
    <div className="listing-photo">
      <img src={`/photos/${l.cover_photo_id}?size=thumb`} alt="" loading="lazy" />
      {l.is_demo === 1 && <span className="photo-tag">{t("listing.demoBadge")}</span>}
    </div>
  );
  return (
    <div className="ph">
      <span className="tag">
        {t(`cat.${l.category}`)}
        {l.is_demo ? ` · ${t("listing.demoBadge")}` : ""}
      </span>
      <span className="placeholder-label">{t("listing.noPhoto")}</span>
    </div>
  );
}

export function ListingCard({ l, t, locale }: { l: ListingRow; t: T; locale: Locale }) {
  return (
    <article className="card">
      <Link href={`/listing/${l.id}`} className="media">
        <Photo l={l} t={t} />
      </Link>
      <div className="body">
        <h3>
          <Link href={`/listing/${l.id}`}>{l.title}</Link>
        </h3>
        <div className="price">
          {formatMoney(l.price_cents, locale)} {l.status === "sold" && <span className="badge sold">{t("listing.sold")}</span>}
        </div>
        <div className="muted">{l.shop_name} · {t(`cond.${l.condition}`)}</div>
      </div>
    </article>
  );
}

/** Publication du fil : ouvrir l'annonce est la seule action ; aucun achat ni enchère par simple tap. */
export function FeedPost({ l, t, locale, canHide }: { l: ListingRow; t: T; locale: Locale; canHide: boolean }) {
  const b = breakdown(l.price_cents, l.shipping_cents);
  return (
    <article className="feedpost" aria-label={l.title}>
      <Link href={`/listing/${l.id}`} className="media" style={{ textDecoration: "none" }}>
        <Photo l={l} t={t} />
      </Link>
      <div className="body">
        <span className="micro">{t("listing.number")} · {l.id}</span>
        <h2>{l.title}</h2>
        <div className="muted">
          <Link href={`/shop/${l.shop_slug}`}>{l.shop_name}</Link> · {t(`cond.${l.condition}`)}
        </div>
        <table className="sum">
          <tbody>
            <tr><td>{t("listing.price")}</td><td>{formatMoney(b.priceCents, locale)}</td></tr>
            <tr><td>{t("listing.fee")}</td><td>{formatMoney(b.feeCents, locale)}</td></tr>
            <tr><td>{t("listing.shipping")}</td><td>{b.shippingCents === null ? t("listing.shipping.tbd") : formatMoney(b.shippingCents, locale)}</td></tr>
            <tr className="total"><td>{t("listing.total")}</td><td>{b.totalCents === null ? t("listing.total.tbd") : formatMoney(b.totalCents, locale)}</td></tr>
          </tbody>
        </table>
        <div className="row">
          {l.status === "sold" ? (
            <span className="badge sold">{t("listing.sold")}</span>
          ) : (
            <Link className="btn amber" href={`/listing/${l.id}`}>{t("listing.open")}</Link>
          )}
          {canHide && (
            <form action={hideListing}>
              <input type="hidden" name="id" value={l.id} />
              <button className="linkbtn" type="submit">{t("feed.hide")}</button>
            </form>
          )}
        </div>
        <details>
          <summary className="muted">{t("feed.why")}</summary>
          <p className="muted">{t("feed.why.text")}</p>
        </details>
      </div>
    </article>
  );
}
