import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/locale";
import { pendingReports, recentReviews } from "@/lib/moderation";
import { ReviewForm } from "@/components/ReviewForm";

export default async function AdminReports() {
  const user = await currentUser();
  if (!user || user.role !== "admin") notFound();
  const { t } = await getT();
  const pending = pendingReports(db(), user.id);
  const reviewed = recentReviews(db(), user.id);
  const errors = Object.fromEntries(["forbidden", "invalid", "unavailable"].map((key) => [key, t(`moderation.error.${key}`)]));
  return <>
    <p className="micro">{t("moderation.eyebrow")}</p>
    <h1>{t("moderation.title")}</h1>
    <p>{t("moderation.explanation")}</p>
    <h2>{t("moderation.pending")}</h2>
    <p className="muted">{t("moderation.limit")}</p>
    {pending.length === 0 ? <p>{t("moderation.empty")}</p> : pending.map((report) => <section key={report.id} className="moderation-item">
      <h3>{t("moderation.report")} #{report.id} · {report.title}</h3>
      <p className="muted">{report.created_at} UTC · {t("moderation.listingStatus")}: {report.listing_status}</p>
      {(report.listing_status === "published" || report.listing_status === "sold") &&
        <p><Link href={`/listing/${report.listing_id}`}>{t("moderation.openListing")}</Link></p>}
      <p><strong>{t("moderation.reason")}:</strong> {report.reason}</p>
      <p style={{ whiteSpace: "pre-wrap" }}><strong>{t("moderation.description")}:</strong> {report.description}</p>
      <ReviewForm reportId={report.id} note={t("moderation.note")} submit={t("moderation.mark")} errors={errors} />
    </section>)}
    <h2>{t("moderation.recent")}</h2>
    {reviewed.length === 0 ? <p>{t("moderation.empty")}</p> : <ul className="moderation-history">{reviewed.map((review) =>
      <li key={review.id}>#{review.id} · {review.title} · {review.reviewer} · {review.reviewed_at} UTC — {review.note}</li>)}</ul>}
    <p><Link href="/account">{t("connect.back")}</Link></p>
  </>;
}
