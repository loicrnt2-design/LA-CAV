"use client";

import { useActionState, useEffect, useState } from "react";

type Action = (prev: string | null, fd: FormData) => Promise<string | null>;
export interface SellLabels {
  title: string; description: string; price: string; shipping: string; location: string; brand: string;
  category: string; condition: string; save: string; draft: string; error: string; hand: string;
  photoLabel: string; photoHelp: string; photoPrivacy: string; photoRetry: string; photoErrors: Record<string, string>;
  categories: [string, string][]; conditions: [string, string][];
}

export function SellForm({ action, L }: { action: Action; L: SellLabels }) {
  const [err, run, pending] = useActionState(action, null);
  const [values, setValues] = useState({
    title: "", category: L.categories[0]?.[0] ?? "", condition: "good", brand: "",
    description: "", price: "", shipping: "", location: "", hand: false,
  });
  const [formRevision, setFormRevision] = useState(0);
  useEffect(() => {
    if (!pending && err) setFormRevision((revision) => revision + 1);
  }, [pending, err]);
  function update(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    const next = event.target instanceof HTMLInputElement && event.target.type === "checkbox" ? event.target.checked : value;
    setValues((current) => ({ ...current, [name]: next }));
  }
  return (
    <form key={formRevision} action={run} className="stack">
      <label>{L.title}<input name="title" required minLength={3} maxLength={120} value={values.title} onChange={update} /></label>
      <label>{L.category}
        <select name="category" required value={values.category} onChange={update}>{L.categories.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select>
      </label>
      <label>{L.condition}
        <select name="condition" required value={values.condition} onChange={update}>{L.conditions.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select>
      </label>
      <label>{L.brand}<input name="brand" maxLength={60} value={values.brand} onChange={update} /></label>
      <label>{L.description}<textarea name="description" required minLength={10} maxLength={5000} rows={6} value={values.description} onChange={update} /></label>
      <label>{L.photoLabel}<input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-describedby="photo-help" /></label>
      <p className="muted" id="photo-help">{L.photoHelp} {L.photoPrivacy}</p>
      <label>{L.price}<input name="price" required inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?" value={values.price} onChange={update} /></label>
      <label>{L.shipping}<input name="shipping" inputMode="decimal" pattern="([0-9]+([.,][0-9]{1,2})?)?" value={values.shipping} onChange={update} /></label>
      <label>{L.location}<input name="location" maxLength={80} value={values.location} onChange={update} /></label>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input name="hand" type="checkbox" style={{ minHeight: 0 }} checked={values.hand} onChange={update} />{L.hand}</label>
      {err && <p className="err" role="alert">{L.photoErrors[err] ?? L.error} {L.photoRetry}</p>}
      <div className="row">
        <button className="btn amber" name="intent" value="publish" disabled={pending} type="submit">{L.save}</button>
        <button className="btn ghost" name="intent" value="draft" disabled={pending} type="submit">{L.draft}</button>
      </div>
    </form>
  );
}
