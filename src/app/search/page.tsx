import { getT } from "@/lib/locale";
import { CATEGORIES, CONDITIONS, searchListings } from "@/lib/queries";
import { ListingCard } from "@/components/ListingViews";
import { parseEuroToCents } from "@/lib/pricing";
import { currentUser } from "@/lib/auth";

export default async function Search({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const sp: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) if (typeof value === "string") sp[key] = value;
  const { t, locale } = await getT();
  const user = await currentUser();
  const invalidDelivery = !!sp.delivery && sp.delivery !== "shipping" && sp.delivery !== "hand";
  const maxPriceCents = sp.max ? parseEuroToCents(sp.max) : undefined;
  const page = sp.page ? Number(sp.page) : 1;
  const invalid = Object.values(raw).some(Array.isArray) || invalidDelivery ||
    (!!sp.category && !CATEGORIES.some((v) => v === sp.category)) ||
    (!!sp.condition && !CONDITIONS.some((v) => v === sp.condition)) ||
    (sp.max !== undefined && sp.max !== "" && maxPriceCents === null) ||
    !Number.isSafeInteger(page) || page < 1 || page > 100000 ||
    (sp.brand?.length ?? 0) > 60 || (sp.location?.length ?? 0) > 80 || (sp.q?.length ?? 0) > 200;
  const delivery = sp.delivery === "shipping" || sp.delivery === "hand" ? sp.delivery : undefined;
  const items = invalid ? [] : searchListings({
    q: sp.q?.trim() || undefined,
    category: CATEGORIES.find((c) => c === sp.category),
    condition: CONDITIONS.find((c) => c === sp.condition),
    brand: sp.brand?.trim() || undefined,
    location: sp.location?.trim() || undefined,
    delivery,
    maxPriceCents: maxPriceCents ?? undefined,
    excludeHiddenFor: user?.id,
    limit: 24,
    offset: (page - 1) * 24,
  });
  const qs = (p: number) => new URLSearchParams({ ...(Object.fromEntries(Object.entries(sp).filter(([, v]) => v)) as Record<string, string>), page: String(p) }).toString();
  return (
    <>
      <h1>{t("nav.search")}</h1>
      <form className="filters" method="get">
        <label>{t("search.go")}<input name="q" defaultValue={sp.q} placeholder={t("search.placeholder")} type="search" maxLength={200} /></label>
        <label>{t("search.category")}
          <select name="category" defaultValue={sp.category ?? ""}>
            <option value="">{t("search.all")}</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{t(`cat.${c}`)}</option>)}
          </select>
        </label>
        <label>{t("search.condition")}
          <select name="condition" defaultValue={sp.condition ?? ""}>
            <option value="">{t("search.all")}</option>
            {CONDITIONS.map((c) => <option key={c} value={c}>{t(`cond.${c}`)}</option>)}
          </select>
        </label>
        <label>{t("search.maxPrice")}<input name="max" defaultValue={sp.max} inputMode="decimal" size={8} /></label>
        <label>{t("search.brand")}<input name="brand" defaultValue={sp.brand} maxLength={60} /></label>
        <label>{t("search.location")}<input name="location" defaultValue={sp.location} maxLength={80} /></label>
        <label>{t("search.delivery")}
          <select name="delivery" defaultValue={delivery ?? ""}>
            <option value="">{t("search.deliveryAll")}</option>
            <option value="shipping">{t("search.deliveryShipping")}</option>
            <option value="hand">{t("search.deliveryHand")}</option>
          </select>
        </label>
        <button className="btn" type="submit">{t("search.go")}</button>
      </form>
      {invalid ? <p className="err" role="alert">{t("search.invalid")}</p> :
        items.length === 0 ? <p className="muted">{t("search.none")}</p> : <div className="grid">{items.map((l) => <ListingCard key={l.id} l={l} t={t} locale={locale} />)}</div>}
      <div className="row" style={{ marginTop: 16 }}>
        {!invalid && page > 1 && <a className="btn ghost" href={`?${qs(page - 1)}`}>←</a>}
        {items.length === 24 && <a className="btn ghost" href={`?${qs(page + 1)}`}>→</a>}
      </div>
    </>
  );
}
