import { notFound } from "next/navigation";
import { getT } from "@/lib/locale";
import { currentUser } from "@/lib/auth";
import { getShopBySlug, searchListings } from "@/lib/queries";
import { ListingCard } from "@/components/ListingViews";
import { db } from "@/lib/db";
import { toggleFollow } from "../../actions";

export default async function Shop({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = getShopBySlug(slug);
  if (!shop) notFound();
  const { t, locale } = await getT();
  const user = await currentUser();
  const following = user ? !!db().prepare("SELECT 1 FROM follows WHERE user_id=? AND shop_id=?").get(user.id, shop.id) : false;
  const items = searchListings({ shopId: shop.id, limit: 60 });
  return (
    <>
      <section className="shop-hero">
      <p className="micro">{t("account.shop")}{shop.is_demo ? ` · ${t("listing.demoBadge")}` : ""}</p>
      <h1>{shop.name}</h1>
      <p>{shop.description}</p>
      {user?.id !== shop.owner_id && (
        <form action={toggleFollow}>
          <input type="hidden" name="shopId" value={shop.id} />
          <button className="btn ghost" type="submit">{following ? t("shop.unfollow") : t("shop.follow")}</button>
        </form>
      )}
      </section>
      <h2 style={{ marginTop: 24 }}>{t("shop.items")}</h2>
      {items.length === 0 ? <p className="muted">{t("feed.empty")}</p> : <div className="grid">{items.map((l) => <ListingCard key={l.id} l={l} t={t} locale={locale} />)}</div>}
    </>
  );
}
