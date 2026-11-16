import Link from "next/link";
import { getT } from "@/lib/locale";
import { currentUser } from "@/lib/auth";
import { CATEGORIES, CONDITIONS } from "@/lib/queries";
import { SellForm } from "@/components/SellForm";
import { createListing } from "../actions";

export default async function Sell() {
  const { t } = await getT();
  const user = await currentUser();
  if (!user)
    return (
      <>
        <h1>{t("sell.title")}</h1>
        <p><Link className="btn" href="/login">{t("auth.login")}</Link> <Link className="btn ghost" href="/register">{t("auth.register")}</Link></p>
      </>
    );
  return (
    <>
      <h1>{t("sell.title")}</h1>
      <p className="notice">{t("sell.note")}</p>
      <SellForm
        action={createListing}
        L={{
          title: t("sell.field.title"), description: t("sell.field.description"), price: t("sell.field.price"),
          shipping: t("sell.field.shipping"), location: t("sell.field.location"), brand: t("sell.field.brand"),
          category: t("search.category"), condition: t("search.condition"), save: t("sell.save"), draft: t("sell.draft"),
          error: t("common.required"), hand: t("listing.handDelivery"),
          photoLabel: t("photo.label"), photoHelp: t("photo.help"), photoPrivacy: t("photo.privacy"), photoRetry: t("photo.retry"),
          photoErrors: Object.fromEntries(["count", "size", "format", "access", "unavailable"].map((key) => [`photo.${key}`, t(`photo.${key}`)])),
          categories: CATEGORIES.map((c) => [c, t(`cat.${c}`)]), conditions: CONDITIONS.map((c) => [c, t(`cond.${c}`)]),
        }}
      />
    </>
  );
}
