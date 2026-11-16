import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { getT } from "@/lib/locale";
import { currentUser } from "@/lib/auth";
import { LOCALES } from "@/lib/i18n";
import { setLanguage } from "./actions";
import { seedDemoIfEmpty } from "@/lib/seed";

export const metadata: Metadata = {
  title: "La CAV' — Chinez. Achetez. Vendez.",
  description: "Place de marché d'objets de collection, vintage, montres, bijoux et plus.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#f4efe8", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  seedDemoIfEmpty();
  const { locale, t } = await getT();
  const user = await currentUser();
  const dir = LOCALES.find((l) => l.id === locale)?.dir ?? "ltr";
  return (
    <html lang={locale} dir={dir}>
      <head><link rel="stylesheet" href="/fonts/fonts.css" /></head>
      <body>
        <a className="skip" href="#main">{t("nav.skip")}</a>
        <div className="banner" role="note">{t("common.demoBanner")}</div>
        <header className="top">
          <Link href="/" className="brand">
            La CAV&apos;<small>{t("brand.tagline")}</small>
          </Link>
          <nav className="desknav" aria-label={t("nav.primary")}>
            <Link href="/">{t("nav.discover")}</Link>
            <Link href="/search">{t("nav.search")}</Link>
            <Link href="/sell">{t("nav.sell")}</Link>
            <Link href="/messages">{t("nav.messages")}</Link>
            <Link href={user ? "/account" : "/login"}>{user ? t("nav.account") : t("nav.login")}</Link>
          </nav>
          <form action={setLanguage} className="row language-form">
            <label className="sr" style={{ display: "contents" }}>
              <span className="sr-only">{t("common.language")}</span>
              <select name="lang" defaultValue={locale} aria-label={t("common.language")}>
                {LOCALES.map((l) => (
                  <option key={l.id} value={l.id} lang={l.id}>{l.name}</option>
                ))}
              </select>
            </label>
            <button className="btn ghost" type="submit">OK</button>
          </form>
        </header>
        <main id="main" className="wrap">{children}</main>
        <footer className="wrap muted">
          <Link href="/legal">{t("nav.legal")}</Link>
        </footer>
        <nav className="bottomnav" aria-label={t("nav.mobile")}>
          <Link href="/">{t("nav.discover")}</Link>
          <Link href="/search">{t("nav.search")}</Link>
          <Link href="/sell">{t("nav.sell")}</Link>
          <Link href="/messages">{t("nav.messages")}</Link>
          <Link href={user ? "/account" : "/login"}>{user ? t("nav.account") : t("nav.login")}</Link>
        </nav>
      </body>
    </html>
  );
}
