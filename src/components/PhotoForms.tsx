"use client";

import { useActionState } from "react";
import { editListingPhoto, uploadListingPhotos } from "@/app/photo-actions";

type Labels = {
  add: string; label: string; help: string; privacy: string;
  previous: string; next: string; remove: string; confirmRemove: string; errors: Record<string, string>;
};

function ErrorMessage({ error, labels }: { error: string | null; labels: Labels }) {
  return error ? <p className="err" role="alert">{labels.errors[error] ?? labels.errors.access}</p> : null;
}

export function PhotoUploadForm({ listingId, labels }: { listingId: number; labels: Labels }) {
  const [error, action, pending] = useActionState(uploadListingPhotos, null);
  return <form action={action} className="stack">
    <input type="hidden" name="listingId" value={listingId} />
    <label>{labels.label}<input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple required aria-describedby="photo-upload-help" /></label>
    <p id="photo-upload-help" className="muted">{labels.help} {labels.privacy}</p>
    <ErrorMessage error={error} labels={labels} />
    <button className="btn amber" type="submit" disabled={pending}>{labels.add}</button>
  </form>;
}

export function PhotoEditForm({ listingId, photoId, first, last, labels }: {
  listingId: number; photoId: number; first: boolean; last: boolean; labels: Labels;
}) {
  const [error, action, pending] = useActionState(editListingPhoto, null);
  return <form action={action}>
    <input type="hidden" name="listingId" value={listingId} />
    <input type="hidden" name="photoId" value={photoId} />
    <div className="row">
      <button className="linkbtn" type="submit" name="operation" value="previous" disabled={pending || first}>{labels.previous}</button>
      <button className="linkbtn" type="submit" name="operation" value="next" disabled={pending || last}>{labels.next}</button>
      <button className="linkbtn" type="submit" name="operation" value="remove" disabled={pending}
        onClick={(event) => { if (!window.confirm(labels.confirmRemove)) event.preventDefault(); }}>{labels.remove}</button>
    </div>
    <ErrorMessage error={error} labels={labels} />
  </form>;
}
