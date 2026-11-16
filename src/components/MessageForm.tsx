import { sendMessage } from "@/app/actions";

export function MessageForm({ listingId, label, send, to }: { listingId: number; label: string; send: string; to?: number }) {
  return (
    <form action={sendMessage} className="stack">
      <input type="hidden" name="listingId" value={listingId} />
      {to ? <input type="hidden" name="to" value={to} /> : null}
      <label>{label}<textarea name="body" required maxLength={2000} rows={3} /></label>
      <button className="btn" type="submit">{send}</button>
    </form>
  );
}
