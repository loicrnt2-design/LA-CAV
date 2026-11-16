import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/locale";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MessageForm } from "@/components/MessageForm";

interface Conv { listing_id: number; other: number; title: string; other_name: string; last: string }
interface Msg { id: number; from_user: number; body: string; created_at: string }

export default async function Messages({ searchParams }: { searchParams: Promise<{ l?: string; with?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const { t } = await getT();
  const convs = db()
    .prepare(
      `SELECT m.listing_id, CASE WHEN m.from_user = @u THEN m.to_user ELSE m.from_user END AS other,
              l.title, u.display_name AS other_name, MAX(m.created_at) AS last
       FROM messages m JOIN listings l ON l.id = m.listing_id
       JOIN users u ON u.id = CASE WHEN m.from_user = @u THEN m.to_user ELSE m.from_user END
       WHERE m.from_user = @u OR m.to_user = @u GROUP BY m.listing_id, other ORDER BY last DESC`,
    )
    .all({ u: user.id }) as Conv[];
  const lid = Number(sp.l), other = Number(sp.with);
  const current = convs.find((c) => c.listing_id === lid && c.other === other);
  let thread: Msg[] = [];
  if (current) {
    db().prepare("UPDATE messages SET read_at = datetime('now') WHERE listing_id=? AND to_user=? AND from_user=? AND read_at IS NULL").run(lid, user.id, other);
    thread = db()
      .prepare("SELECT id, from_user, body, created_at FROM messages WHERE listing_id=? AND ((from_user=? AND to_user=?) OR (from_user=? AND to_user=?)) ORDER BY id")
      .all(lid, user.id, other, other, user.id) as Msg[];
  }
  return (
    <>
      <h1>{t("messages.title")}</h1>
      <p className="muted">{t("messages.translate")}</p>
      {convs.length === 0 ? <p className="muted">{t("messages.none")}</p> : (
        <ul>{convs.map((c) => <li key={`${c.listing_id}-${c.other}`}><Link href={`/messages?l=${c.listing_id}&with=${c.other}`}>{c.other_name} — {c.title}</Link></li>)}</ul>
      )}
      {current && (
        <section aria-label={current.title} style={{ display: "grid", gap: 8, marginTop: 16 }}>
          {thread.map((m) => <div key={m.id} className={`msg${m.from_user === user.id ? " mine" : ""}`} style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>)}
          <MessageForm listingId={lid} to={other} label={t("messages.title")} send={t("messages.send")} />
        </section>
      )}
    </>
  );
}
