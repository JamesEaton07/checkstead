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
        <p className="text-xs text-neutral-500">
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
          <span className="text-xs text-neutral-400">
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
          className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <p className="text-xs text-neutral-500">
          Used later to flag rent as late on a tenant&apos;s reliability record.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && (
        <p className="text-sm text-green-600">Settings saved.</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
