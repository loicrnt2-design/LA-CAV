"use client";

import { useActionState } from "react";
import { submitDemoOrder, submitDemoSupport, submitDemoCancellation } from "@/app/demo-actions";
import type { DeliveryMode } from "@/lib/demo-orders";

type Errors = { unavailable: string; changed: string; invalid: string; not_found: string };

function ErrorMessage({ error, errors }: { error: string | null; errors: Errors }) {
  if (!error) return null;
  return <p className="err" role="alert">{errors[error as keyof Errors] ?? errors.invalid}</p>;
}

export function DemoOrderForm({ listingId, requestKey, mode, version, total, submit, errors }: {
  listingId: number; requestKey: string; mode: DeliveryMode; version: number; total: number; submit: string; errors: Errors;
}) {
  const [error, action, pending] = useActionState(submitDemoOrder, null);
  return <form action={action} className="stack">
    <input type="hidden" name="listingId" value={listingId} />
    <input type="hidden" name="requestKey" value={requestKey} />
    <input type="hidden" name="mode" value={mode} />
    <input type="hidden" name="version" value={version} />
    <input type="hidden" name="total" value={total} />
    <ErrorMessage error={error} errors={errors} />
    <button className="btn amber" type="submit" disabled={pending}>{submit}</button>
  </form>;
}

export function DemoSupportForm({ orderId, labels, errors }: {
  orderId: number;
  labels: { reason: string; message: string; submit: string; reasons: [string, string][] };
  errors: Errors;
}) {
  const [error, action, pending] = useActionState(submitDemoSupport, null);
  return <form action={action} className="stack">
    <input type="hidden" name="orderId" value={orderId} />
    <label>{labels.reason}<select name="reason">{labels.reasons.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>
    <label>{labels.message}<textarea name="message" required minLength={3} maxLength={2000} rows={4} /></label>
    <ErrorMessage error={error} errors={errors} />
    <button className="btn ghost" type="submit" disabled={pending}>{labels.submit}</button>
  </form>;
}

export function DemoCancelForm({ orderId, submit, errors }: { orderId: number; submit: string; errors: Errors }) {
  const [error, action, pending] = useActionState(submitDemoCancellation, null);
  return <form action={action}>
    <input type="hidden" name="orderId" value={orderId} />
    <ErrorMessage error={error} errors={errors} />
    <button className="btn ghost" type="submit" disabled={pending}>{submit}</button>
  </form>;
}
