import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/lib/locale";

export default async function Design() {
  if (process.env.NODE_ENV !== "development") notFound();
  const { t } = await getT();
  return <>
    <p className="micro">La CAV&apos; · Design</p>
    <h1>Direction artistique</h1>
    <p className="muted">Répertoire de composants — environnement de développement uniquement.</p>
    <section className="design-block">
      <p className="micro">Clair · typographie</p>
      <h2>{t("hero.title")} <em>{t("hero.titleEm")}</em></h2>
      <p>{t("hero.description")}</p>
      <p className="price">{t("listing.total.tbd")}</p>
      <div className="row">
        <Link className="btn" href="/search">{t("nav.search")}</Link>
        <Link className="btn ghost" href="/">{t("nav.discover")}</Link>
        <button className="btn" disabled>{t("listing.buy")}</button>
      </div>
      <p className="notice" style={{ marginTop: "1.5rem" }}>{t("listing.buy.disabled")}</p>
      <span className="badge sold">{t("listing.sold")}</span>
      <p className="muted">{t("feed.empty")}</p>
      <label>{t("search.placeholder")}<input type="text" /></label>
    </section>
    <section className="design-block theme-dark">
      <p className="micro">Sombre · fil</p>
      <h2>{t("nav.discover")}</h2>
      <p>{t("listing.noPhoto")}</p>
      <p className="muted">{t("listing.demoRates")}</p>
      <Link className="btn amber" href="/">{t("listing.open")}</Link>
    </section>
  </>;
}
