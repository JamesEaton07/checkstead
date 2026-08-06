"use client";

import { useState, useTransition } from "react";
import type { Landlord } from "@/lib/types/database";
import { updateSettings } from "@/lib/actions/settings";

export function SettingsForm({ landlord }: { landlord: Landlord }) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSettings(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Notification preference</legend>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Choose one or both channels for your own alerts.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="notify_email"
            defaultChecked={landlord.notify_email}
          />
          Email (default)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="notify_sms"
            defaultChecked={landlord.notify_sms}
          />
          SMS
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            (delivery arrives in a later update)
          </span>
        </label>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="days_late_threshold" className="text-sm font-medium">
          Days late before rent is flagged
        </label>
        <input
          id="days_late_threshold"
          name="days_late_threshold"
          type="number"
          min={0}
          step={1}
          defaultValue={landlord.days_late_threshold}
          className="w-32 rounded-md border border-neutral-500 px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
        />
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Used later to flag rent as late on a tenant&apos;s reliability record.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {saved && !error && (
        <p role="status" className="text-sm text-green-800 dark:text-green-400">
          Settings saved.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100"
      >
        {isPending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
