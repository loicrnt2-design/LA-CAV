"use client";

import { useActionState } from "react";
import { reportListing } from "@/app/actions";

export function ReportForm({ listingId, label, success, invalid, unavailable }: {
  listingId: number; label: string; success: string; invalid: string; unavailable: string;
}) {
  const [result, action, pending] = useActionState(reportListing, null);
  return <form action={action} className="stack">
    <input type="hidden" name="id" value={listingId} />
    <input name="reason" required minLength={3} maxLength={500} aria-label={label} />
    <button className="btn ghost" type="submit" disabled={pending}>{label}</button>
    {result && <p role={result === "success" ? "status" : "alert"} className={result === "success" ? "notice" : "err"}>
      {result === "success" ? success : result === "invalid" ? invalid : unavailable}
    </p>}
  </form>;
}
