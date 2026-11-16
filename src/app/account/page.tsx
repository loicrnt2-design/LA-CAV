import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/locale";
import { currentUser } from "@/lib/auth";
import { favoritesOf, listingsByOwner } from "@/lib/queries";
import { formatMoney } from "@/lib/i18n";
import { logout, setListingStatus } from "../actions";

export default async function Account() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { t, locale } = await getT();
  const mine = listingsByOwner(user.id);
  const favs = favoritesOf(user.id);
  return (
    <>
      <h1>{t("account.title")} — {user.display_name}</h1>
      <p className="muted">{t("account.id")} : {user.id}</p>
      <p><Link href="/orders">{t("demo.history")}</Link></p>
      <p><Link href="/seller/payments">{t("connect.accountLink")}</Link></p>
      {user.role === "admin" && <p><Link href="/admin/reports">{t("moderation.title")}</Link></p>}
      <h2>{t("account.listings")}</h2>
      {mine.length === 0 ? <p className="muted">{t("account.empty")}</p> : (
        <table className="sum">
          <tbody>
            {mine.map((l) => (
              <tr key={l.id}>
                <td><Link href={`/listing/${l.id}`}>{l.title}</Link> <span className="badge">{l.status}</span>
                  {l.status !== "sold" && <> · <Link href={`/listing/${l.id}/photos`}>{t("photo.manage")}</Link></>}
                </td>
                <td>{formatMoney(l.price_cents, locale)} · 👁 {l.views}</td>
                <td>
                  {l.status !== "sold" && (
                    <form action={setListingStatus} className="row">
                      <input type="hidden" name="id" value={l.id} />
                      {l.status !== "published" && <button className="linkbtn" name="status" value="published">{t("account.publish")}</button>}
                      {l.status !== "archived" && <button className="linkbtn" name="status" value="archived">{t("account.archive")}</button>}
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h2 style={{ marginTop: 24 }}>{t("account.favorites")}</h2>
      {favs.length === 0 ? <p className="muted">{t("account.empty")}</p> : <ul>{favs.map((l) => <li key={l.id}><Link href={`/listing/${l.id}`}>{l.title}</Link></li>)}</ul>}
      <form action={logout} style={{ marginTop: 24 }}><button className="btn ghost" type="submit">{t("auth.logout")}</button></form>
    </>
  );
}
