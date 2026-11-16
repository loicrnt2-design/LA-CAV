"use client";

import { useActionState } from "react";
import { reviewAction } from "@/app/moderation-actions";

export function ReviewForm({ reportId, note, submit, errors }: {
  reportId: number; note: string; submit: string; errors: Record<string, string>;
}) {
  const [result, action, pending] = useActionState(reviewAction, null);
  return <form action={action} className="stack">
    <input type="hidden" name="id" value={reportId} />
    <label>{note}<textarea name="note" minLength={3} maxLength={500} required rows={2} /></label>
    <button className="btn ghost" type="submit" disabled={pending}>{submit}</button>
    {result && result !== "success" && <p className="err" role="alert">{errors[result] ?? errors.unavailable}</p>}
  </form>;
}
