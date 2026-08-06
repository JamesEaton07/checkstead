"use client";

import { useState, useTransition } from "react";
import { getBaselinePhotoUrls } from "@/lib/actions/checkin-photos";
import type { BaselineCheckinSummary } from "./page";

const CATEGORY_LABELS: Record<string, string> = {
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  living_room: "Living room",
  bedroom: "Bedroom",
  exterior: "Exterior",
  other: "Other",
};

export function BaselineCheckinGallery({ checkin }: { checkin: BaselineCheckinSummary }) {
  const [expanded, setExpanded] = useState(false);
  const [photos, setPhotos] = useState<{ id: string; category: string; url: string }[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (photos !== null) return;
    setError(null);
    startTransition(async () => {
      const result = await getBaselinePhotoUrls(checkin.checkinId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setPhotos(result.photos);
    });
  }

  const statusLabel =
    checkin.status === "submitted"
      ? `Baseline submitted${
          checkin.submittedAt ? ` ${new Date(checkin.submittedAt).toLocaleDateString()}` : ""
        } — ${checkin.photoCount} photo${checkin.photoCount === 1 ? "" : "s"}`
      : "Baseline check-in pending";

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-neutral-600 dark:text-neutral-400">{statusLabel}</span>
        {checkin.photoCount > 0 && (
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={expanded}
            className="rounded-sm text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100"
          >
            {expanded ? "Hide photos" : "View photos"}
          </button>
        )}
      </div>

      {expanded && (
        <div>
          {isPending && (
            <p role="status" className="text-xs text-neutral-500 dark:text-neutral-400">
              Loading photos…
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          {photos && photos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {photos.map((photo) => (
                <a
                  key={photo.id}
                  href={photo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1 dark:focus:ring-neutral-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={`${CATEGORY_LABELS[photo.category] ?? photo.category} photo, opens full size`}
                    className="h-20 w-20 rounded-md border border-neutral-200 object-cover"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
