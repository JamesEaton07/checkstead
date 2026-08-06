"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { PhotoCategory } from "@/lib/types/database";

const PHOTO_CATEGORIES: PhotoCategory[] = [
  "kitchen",
  "bathroom",
  "living_room",
  "bedroom",
  "exterior",
  "other",
];

type UploadUrlResult =
  | { error: string; path: null; signedUrl: null; uploadToken: null }
  | { error: null; path: string; signedUrl: string; uploadToken: string };

// Tenants have no Supabase Auth session, so this is the one step that
// needs the service role key: minting a signed Storage upload URL. Every
// other step (recording the row, listing photos, submitting) goes
// through security-definer RPCs the anon client can call directly,
// because those self-validate the token in Postgres. This action
// re-validates the token independently before touching Storage, so an
// attacker can't get a signed URL for someone else's checkin just by
// guessing a category string.
export async function requestPhotoUploadUrl(
  token: string,
  category: string
): Promise<UploadUrlResult> {
  if (!PHOTO_CATEGORIES.includes(category as PhotoCategory)) {
    return { error: "Not a valid photo category.", path: null, signedUrl: null, uploadToken: null };
  }

  const supabase = await createClient();
  const { data: checkin } = await supabase
    .rpc("get_tenant_baseline_checkin", { p_token: token })
    .maybeSingle();

  if (!checkin || !checkin.active || checkin.status !== "pending") {
    return {
      error: "This link can't upload photos right now.",
      path: null,
      signedUrl: null,
      uploadToken: null,
    };
  }

  const path = `${checkin.checkin_id}/${category}-${crypto.randomUUID()}.jpg`;

  const { data, error } = await createServiceRoleClient()
    .storage.from("checkin-photos")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return {
      error: "Couldn't prepare the upload. Please try again.",
      path: null,
      signedUrl: null,
      uploadToken: null,
    };
  }

  return { error: null, path: data.path, signedUrl: data.signedUrl, uploadToken: data.token };
}

const SIGNED_READ_URL_EXPIRY_SECONDS = 60;

// Landlord-facing view of a submitted baseline check-in. Uses the regular
// authenticated (session-based) client, not the service role — Storage
// respects the landlord-only SELECT policy on storage.objects (0011), so
// this can only ever produce URLs for checkins the calling landlord
// actually owns. No token involved; the landlord is authenticated via
// their own Supabase Auth session.
export async function getBaselinePhotoUrls(checkinId: string) {
  const supabase = await createClient();

  const { data: photos, error: photosError } = await supabase
    .from("checkin_photos")
    .select("id, category, storage_path")
    .eq("checkin_id", checkinId)
    .order("created_at", { ascending: true });

  if (photosError || !photos || photos.length === 0) {
    return { error: photosError ? "Couldn't load photos." : null, photos: [] };
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("checkin-photos")
    .createSignedUrls(
      photos.map((p) => p.storage_path),
      SIGNED_READ_URL_EXPIRY_SECONDS
    );

  if (signError || !signed) {
    return { error: "Couldn't load photos.", photos: [] };
  }

  const urlByPath = new Map(signed.map((s) => [s.path, s.signedUrl]));

  return {
    error: null,
    photos: photos
      .map((p) => ({
        id: p.id,
        category: p.category,
        url: urlByPath.get(p.storage_path) ?? null,
      }))
      .filter((p): p is { id: string; category: string; url: string } => p.url !== null),
  };
}
