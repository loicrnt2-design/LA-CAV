import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { DemoOrder } from "@/lib/demo-orders";
import { formatMoney } from "@/lib/i18n";
import { getT } from "@/lib/locale";

export default async function Orders() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { t, locale } = await getT();
  const orders = db().prepare("SELECT * FROM demo_orders WHERE buyer_id = ? ORDER BY id DESC").all(user.id) as DemoOrder[];
  return <>
    <h1>{t("demo.history")}</h1>
    <p className="notice">{t("demo.warning")}</p>
    {orders.length === 0 ? <p>{t("demo.empty")}</p> : <ul>
      {orders.map((order) => <li key={order.id}>
        <Link href={`/orders/${order.id}`}>{order.title} — {formatMoney(order.total_cents, locale)}</Link>
        {" · "}{t(`demo.${order.status}`)}
      </li>)}
    </ul>}
  </>;
}
