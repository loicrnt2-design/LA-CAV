import Link from "next/link";
import { getT } from "@/lib/locale";
import { currentUser } from "@/lib/auth";
import { searchListings } from "@/lib/queries";
import { FeedPost, ListingCard } from "@/components/ListingViews";
import { resetHidden } from "./actions";

export default async function Home({ searchParams }: { searchParams: Promise<{ tab?: string; view?: string }> }) {
  const { tab = "foryou", view } = await searchParams;
  const { t, locale } = await getT();
  const user = await currentUser();
  const items =
    tab === "live" || (tab === "following" && !user)
      ? []
      : searchListings({
          followerOf: tab === "following" && user ? user.id : undefined,
          excludeHiddenFor: user?.id,
          limit: 30,
        });
  const empty = tab === "following" && !user ? t("feed.following.empty") : tab === "following" ? t("feed.following.empty") : t("feed.empty");
  const list = view === "list";
  return (
    <>
      <section className="discovery-intro">
        <div>
          <p className="micro">{t("hero.eyebrow")}</p>
          <h1>{t("hero.title")} <em>{t("hero.titleEm")}</em></h1>
        </div>
        <p>{t("hero.description")}</p>
      </section>
      <div className="section-heading">
        <div>
          <p className="micro">{t("brand.tagline")}</p>
          <h2>{t("nav.discover")}</h2>
        </div>
      <nav className="tabs" aria-label={t("nav.discover")}>
        <Link href="/" aria-current={tab === "foryou" ? "page" : undefined}>{t("feed.forYou")}</Link>
        <Link href="/?tab=following" aria-current={tab === "following" ? "page" : undefined}>{t("feed.following")}</Link>
        <Link href="/?tab=live" aria-current={tab === "live" ? "page" : undefined}>{t("feed.live")}</Link>
      </nav>
      </div>
      {tab === "live" ? (
        <p className="notice">{t("feed.live.none")}</p>
      ) : (
        <>
          <div className="row" style={{ marginBottom: 12 }}>
            <Link className="linkbtn" href={list ? `/?tab=${tab}` : `/?tab=${tab}&view=list`}>{list ? t("nav.discover") : t("feed.alt")}</Link>
            {user && (
              <form action={resetHidden}>
                <button className="linkbtn" type="submit">{t("feed.reset")}</button>
              </form>
            )}
          </div>
          {items.length === 0 ? (
            <p className="muted">{empty}</p>
          ) : list ? (
            <div className="grid">{items.map((l) => <ListingCard key={l.id} l={l} t={t} locale={locale} />)}</div>
          ) : (
            <div className="feed">{items.map((l) => <FeedPost key={l.id} l={l} t={t} locale={locale} canHide={!!user} />)}</div>
          )}
        </>
      )}
    </>
  );
}
