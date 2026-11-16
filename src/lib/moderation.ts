import type Database from "better-sqlite3";

export class ModerationError extends Error {
  constructor(public readonly code: "forbidden" | "invalid" | "unavailable") { super(code); }
}

export interface PendingReport {
  id: number;
  listing_id: number;
  title: string;
  listing_status: string;
  description: string;
  reason: string;
  created_at: string;
}
export interface ReviewedReport {
  id: number;
  title: string;
  reviewer: string;
  note: string;
  reviewed_at: string;
}

export function submitReport(database: Database.Database, listingId: number, userId: number | null, reason: string): void {
  const text = reason.trim();
  if (!Number.isSafeInteger(listingId) || listingId < 1 || text.length < 3 || text.length > 500) throw new ModerationError("invalid");
  const inserted = database.prepare(`INSERT INTO reports (listing_id, user_id, reason)
    SELECT id, ?, ? FROM listings WHERE id = ? AND status IN ('published', 'sold')`).run(userId, text, listingId);
  if (inserted.changes !== 1) throw new ModerationError("unavailable");
}

function assertAdmin(database: Database.Database, userId: number): void {
  if (!database.prepare("SELECT 1 FROM users WHERE id = ? AND role = 'admin' AND is_demo = 0").get(userId)) {
    throw new ModerationError("forbidden");
  }
}

export function pendingReports(database: Database.Database, userId: number): PendingReport[] {
  assertAdmin(database, userId);
  return database.prepare(`SELECT r.id, r.listing_id, l.title, l.status AS listing_status, l.description, r.reason, r.created_at
    FROM reports r JOIN listings l ON l.id = r.listing_id
    LEFT JOIN report_reviews v ON v.report_id = r.id WHERE v.report_id IS NULL
    ORDER BY r.id ASC LIMIT 50`).all() as PendingReport[];
}

export function recentReviews(database: Database.Database, userId: number): ReviewedReport[] {
  assertAdmin(database, userId);
  return database.prepare(`SELECT r.id, l.title, u.display_name AS reviewer, v.note, v.created_at AS reviewed_at
    FROM report_reviews v JOIN reports r ON r.id = v.report_id JOIN listings l ON l.id = r.listing_id
    JOIN users u ON u.id = v.reviewer_id ORDER BY v.created_at DESC, v.report_id DESC LIMIT 50`).all() as ReviewedReport[];
}

export function reviewReport(database: Database.Database, userId: number, reportId: number, note: string): void {
  const text = note.trim();
  if (!Number.isSafeInteger(reportId) || reportId < 1 || text.length < 3 || text.length > 500) throw new ModerationError("invalid");
  database.transaction(() => {
    assertAdmin(database, userId);
    const result = database.prepare(`INSERT INTO report_reviews (report_id, reviewer_id, note)
      SELECT id, ?, ? FROM reports r WHERE r.id = ? AND NOT EXISTS
      (SELECT 1 FROM report_reviews v WHERE v.report_id = r.id)`).run(userId, text, reportId);
    if (result.changes !== 1) throw new ModerationError("unavailable");
  }).immediate();
}
