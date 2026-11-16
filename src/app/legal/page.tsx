import { getT } from "@/lib/locale";

const DOCS = ["Mentions légales", "Conditions générales d'utilisation", "Conditions vendeurs", "Règles des enchères", "Règles des lives", "Livraison et retours", "Confidentialité", "Cookies", "Modération", "Classement et recommandations", "Conditions IA"];

export default async function Legal() {
  const { t } = await getT();
  return (
    <>
      <h1>{t("legal.title")}</h1>
      <p className="notice">{t("legal.draft")} Aucune information sur la société d&apos;exploitation n&apos;est publiée : à confirmer.</p>
      <ul>{DOCS.map((d) => <li key={d}>{d} — <span className="badge">À faire valider</span></li>)}</ul>
      <p className="muted">Version des conditions enregistrée à l&apos;inscription : brouillon-0.1.</p>
    </>
  );
}
