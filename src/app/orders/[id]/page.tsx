import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDemoOrder } from "@/lib/demo-orders";
import { demoErrors } from "@/lib/demo-labels";
import { formatMoney } from "@/lib/i18n";
import { getT } from "@/lib/locale";
import { DemoCancelForm, DemoSupportForm } from "@/components/DemoForms";

interface Request { id: number; reason: string; message: string }

export default async function Order({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const order = getDemoOrder(db(), id, user.id);
  if (!order) notFound();
  const requests = db().prepare("SELECT id, reason, message FROM demo_support_requests WHERE order_id = ? AND buyer_id = ? ORDER BY id")
    .all(id, user.id) as Request[];
  const { t, locale } = await getT();
  return <>
    <h1>{t("demo.order")} #{order.id}</h1>
    <p className="notice">{t("demo.warning")}</p>
    <h2>{order.title}</h2>
    <p className="badge">{t(`demo.${order.status}`)}</p>
    <p>{t(`demo.${order.delivery_mode}`)}</p>
    <table className="sum"><tbody>
      <tr><td>{t("listing.price")}</td><td>{formatMoney(order.price_cents, locale)}</td></tr>
      <tr><td>{t("listing.fee")}</td><td>{formatMoney(order.fee_cents, locale)}</td></tr>
      <tr><td>{t("listing.shipping")}</td><td>{formatMoney(order.shipping_cents, locale)}</td></tr>
      <tr className="total"><td>{t("listing.total")}</td><td>{formatMoney(order.total_cents, locale)}</td></tr>
    </tbody></table>
    <p className="muted">{t("listing.demoRates")}</p>
    {order.status === "simulated" && <DemoCancelForm orderId={id} submit={t("demo.cancel")} errors={demoErrors(t)} />}
    <h2 style={{ marginTop: 24 }}>{t("demo.support")}</h2>
    <p className="notice">{t("demo.supportNotice")}</p>
    <DemoSupportForm orderId={id} errors={demoErrors(t)} labels={{
      reason: t("demo.reason"), message: t("demo.message"), submit: t("demo.send"),
      reasons: ["question", "return", "not_received", "damaged", "other"].map((reason) => [reason, t(`demo.${reason}`)]),
    }} />
    {requests.length > 0 && <section><h3>{t("demo.requests")}</h3>
      <ul>{requests.map((request) => <li key={request.id}><strong>{t(`demo.${request.reason}`)}</strong> — {request.message}</li>)}</ul>
    </section>}
    <p><Link href="/orders">{t("demo.history")}</Link></p>
  </>;
}
