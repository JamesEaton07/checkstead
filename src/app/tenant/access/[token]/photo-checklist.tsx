"use client";

import { useId, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/button";
import { createClient } from "@/lib/supabase/client";
import { requestPhotoUploadUrl } from "@/lib/actions/checkin-photos";
import { compressImage, ImageCompressionError } from "@/lib/image-compression";
import { fetchWithProgress } from "@/lib/fetch-with-progress";
import type {
  CheckinStatus,
  Database,
  PhotoCategory,
  TenantCheckinPhotoSummary,
} from "@/lib/types/database";

const CATEGORIES: { value: PhotoCategory; label: string }[] = [
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "living_room", label: "Living room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "exterior", label: "Exterior" },
  { value: "other", label: "Other" },
];

type CategoryState = {
  uploadedCount: number;
  previewUrls: string[];
  // null = idle. A fraction (0–1) while the upload request is actually
  // sending bytes — the Fetch API Supabase's client normally uses has no
  // upload-progress event at all, so this relies on fetch-with-progress
  // swapping in an XMLHttpRequest-backed transport for just this call.
  uploadProgress: number | null;
  error: string | null;
};

function initialState(initialPhotos: TenantCheckinPhotoSummary[]): Record<PhotoCategory, CategoryState> {
  const counts = new Map<PhotoCategory, number>();
  for (const photo of initialPhotos) {
    counts.set(photo.category, (counts.get(photo.category) ?? 0) + 1);
  }
  const state = {} as Record<PhotoCategory, CategoryState>;
  for (const { value } of CATEGORIES) {
    state[value] = {
      uploadedCount: counts.get(value) ?? 0,
      previewUrls: [],
      uploadProgress: null,
      error: null,
    };
  }
  return state;
}

export function PhotoChecklist({
  token,
  initialStatus,
  initialPhotos,
}: {
  token: string;
  initialStatus: CheckinStatus;
  initialPhotos: TenantCheckinPhotoSummary[];
}) {
  const [status, setStatus] = useState(initialStatus);
  const [categories, setCategories] = useState(() => initialState(initialPhotos));
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const idPrefix = useId();

  const allCategoriesComplete = useMemo(
    () => CATEGORIES.every(({ value }) => categories[value].uploadedCount > 0),
    [categories]
  );

  function setProgress(category: PhotoCategory, uploadProgress: number | null) {
    setCategories((prev) => ({
      ...prev,
      [category]: { ...prev[category], uploadProgress },
    }));
  }

  async function handleFileSelected(category: PhotoCategory, file: File) {
    setCategories((prev) => ({
      ...prev,
      [category]: { ...prev[category], uploadProgress: 0, error: null },
    }));

    try {
      const compressed = await compressImage(file);

      const result = await requestPhotoUploadUrl(token, category);
      if (result.error || !result.path || !result.uploadToken) {
        throw new Error(result.error ?? "Couldn't prepare the upload. Please try again.");
      }

      // A throwaway client scoped to this one call — its only job is to
      // route the upload's PUT request through XMLHttpRequest instead of
      // fetch() so upload progress is observable. Every other call in
      // this component keeps using the normal shared client.
      const progressClient = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { fetch: fetchWithProgress((fraction) => setProgress(category, fraction)) } }
      );
      const { error: uploadError } = await progressClient.storage
        .from("checkin-photos")
        .uploadToSignedUrl(result.path, result.uploadToken, compressed, {
          contentType: "image/jpeg",
        });
      if (uploadError) {
        throw new Error("Upload failed. Please try again.");
      }

      const supabase = createClient();
      const { data: recorded, error: recordError } = await supabase.rpc("record_checkin_photo", {
        p_token: token,
        p_category: category,
        p_storage_path: result.path,
      });
      if (recordError || !recorded) {
        throw new Error("Couldn't save this photo. Please try again.");
      }

      const previewUrl = URL.createObjectURL(compressed);
      setCategories((prev) => ({
        ...prev,
        [category]: {
          uploadedCount: prev[category].uploadedCount + 1,
          previewUrls: [...prev[category].previewUrls, previewUrl],
          uploadProgress: null,
          error: null,
        },
      }));
      setAnnouncement(
        `${CATEGORIES.find((c) => c.value === category)?.label} photo uploaded.`
      );
    } catch (err) {
      const message =
        err instanceof ImageCompressionError || err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setCategories((prev) => ({
        ...prev,
        [category]: { ...prev[category], uploadProgress: null, error: message },
      }));
    }
  }

  async function handleSubmit() {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: submitted, error } = await supabase.rpc("submit_baseline_checkin", {
        p_token: token,
      });
      if (error || !submitted) {
        setSubmitError("Couldn't submit your check-in. Please try again.");
        return;
      }
      setStatus("submitted");
      setAnnouncement("Baseline check-in submitted.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "submitted") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <h2 className="text-sm font-semibold text-green-800">Baseline check-in submitted</h2>
        <p className="mt-1 text-sm text-green-700">
          Your move-in photos are on file. Thanks for completing this.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold">Move-in baseline check-in</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Add at least one photo of each area below, then submit. This becomes the reference
          record for your tenancy.
        </p>
      </div>

      <ul className="space-y-4">
        {CATEGORIES.map(({ value, label }) => {
          const cat = categories[value];
          const inputId = `${idPrefix}-${value}`;
          const isUploading = cat.uploadProgress !== null;
          const progressPercent = Math.round((cat.uploadProgress ?? 0) * 100);
          return (
            <li key={value} className="rounded-lg border border-neutral-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor={inputId} className="text-sm font-medium">
                  {label}{" "}
                  {cat.uploadedCount > 0 && (
                    <span className="font-normal text-green-700 dark:text-green-400">
                      — {cat.uploadedCount} uploaded
                    </span>
                  )}
                </label>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isUploading}
                  onClick={() => document.getElementById(inputId)?.click()}
                >
                  {isUploading
                    ? `Uploading… ${progressPercent}%`
                    : cat.uploadedCount > 0
                      ? "Add another"
                      : "Add photo"}
                </Button>
                <input
                  id={inputId}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  disabled={isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) handleFileSelected(value, file);
                  }}
                />
              </div>

              {isUploading && (
                <div
                  role="progressbar"
                  aria-label={`Uploading ${label} photo`}
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
                >
                  <div
                    className="h-full rounded-full bg-neutral-900 transition-[width] dark:bg-neutral-100"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              {cat.previewUrls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {cat.previewUrls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={url}
                      src={url}
                      alt={`${label} photo ${i + 1}`}
                      className="h-16 w-16 rounded-md border border-neutral-200 object-cover"
                    />
                  ))}
                </div>
              )}

              {cat.error && (
                <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {cat.error}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <span role="status" className="sr-only">
        {announcement}
      </span>

      <div>
        <Button onClick={handleSubmit} disabled={!allCategoriesComplete || isSubmitting}>
          {isSubmitting ? "Submitting…" : "Submit baseline check-in"}
        </Button>
        {!allCategoriesComplete && (
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            Add at least one photo of each area before submitting.
          </p>
        )}
        {submitError && (
          <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
            {submitError}
          </p>
        )}
      </div>
    </div>
  );
}
