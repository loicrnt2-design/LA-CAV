"use client";

import { useActionState } from "react";

type Action = (prev: string | null, fd: FormData) => Promise<string | null>;
export interface Labels {
  email: string; password: string; name?: string; terms?: string; submit: string; error: string;
}

export function AuthForm({ action, labels, register }: { action: Action; labels: Labels; register?: boolean }) {
  const [err, run, pending] = useActionState(action, null);
  return (
    <form action={run} className="stack">
      {register && <label>{labels.name}<input name="name" required minLength={2} maxLength={60} autoComplete="nickname" /></label>}
      <label>{labels.email}<input name="email" type="email" required autoComplete="email" /></label>
      <label>{labels.password}<input name="password" type="password" required minLength={register ? 10 : 1} autoComplete={register ? "new-password" : "current-password"} /></label>
      {register && <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input name="terms" type="checkbox" required style={{ minHeight: 0 }} />{labels.terms}</label>}
      {err && <p className="err" role="alert">{labels.error}</p>}
      <button className="btn" disabled={pending} type="submit">{labels.submit}</button>
    </form>
  );
}
