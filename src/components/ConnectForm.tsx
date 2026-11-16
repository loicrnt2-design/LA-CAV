"use client";

import { useActionState } from "react";
import { connectAction } from "@/app/connect-actions";

export function ConnectForm({ operation, label, errors }: {
  operation: "onboard" | "refresh"; label: string; errors: Record<string, string>;
}) {
  const [error, action, pending] = useActionState(connectAction, null);
  return <form action={action} className="stack">
    <input type="hidden" name="operation" value={operation} />
    <button className={operation === "onboard" ? "btn amber" : "btn ghost"} type="submit" disabled={pending}>{label}</button>
    {error && <p className="err" role="alert">{errors[error] ?? errors.provider}</p>}
  </form>;
}
