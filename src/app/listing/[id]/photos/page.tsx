import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listPhotos, MAX_PHOTOS } from "@/lib/photos";
import { getListing } from "@/lib/queries";
import { getT } from "@/lib/locale";
import { PhotoEditForm, PhotoUploadForm } from "@/components/PhotoForms";

export default async function ManagePhotos({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const listingId = Number((await params).id);
  if (!Number.isSafeInteger(listingId) || listingId < 1) notFound();
  const listing = getListing(listingId);
  if (!listing || listing.owner_id !== user.id || listing.status === "sold") notFound();
  const { t } = await getT();
  const photos = listPhotos(db(), listing.id);
  const labels = {
    label: t("photo.label"), help: t("photo.help"), privacy: t("photo.privacy"), add: t("photo.add"),
    previous: t("photo.previous"), next: t("photo.next"), remove: t("photo.remove"),
    confirmRemove: t("photo.confirmRemove"),
    errors: Object.fromEntries(["count", "size", "format", "access", "unavailable"].map((key) => [key, t(`photo.${key}`)])),
  };
  return <>
    <p className="micro">{t("listing.number")} · {listing.id}</p>
    <h1>{t("photo.manage")}</h1>
    <p><Link href={`/listing/${listing.id}`}>{listing.title}</Link></p>
    <p className="notice">{t("photo.privacy")}</p>
    {photos.length > 0 && <div className="photo-management">
      {photos.map((photo, index) => <section key={photo.id} className="photo-management-item">
        <img src={`/photos/${photo.id}?size=thumb`} alt={`${listing.title} — ${index + 1}`} />
        <p className="micro">{index + 1} / {photos.length}</p>
        <PhotoEditForm listingId={listing.id} photoId={photo.id} first={index === 0} last={index === photos.length - 1} labels={labels} />
        <a href={`/photos/${photo.id}?original=1`}>{t("photo.download")}</a>
      </section>)}
    </div>}
    {photos.length < MAX_PHOTOS && <PhotoUploadForm listingId={listing.id} labels={labels} />}
  </>;
}
