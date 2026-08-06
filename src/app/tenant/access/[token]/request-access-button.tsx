"use client";

import { useState, useTransition } from "react";
import { requestTenantAccess } from "@/lib/actions/tenant-access-requests";

export function RequestAccessButton({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await requestTenantAccess(token);
      if (result.error) {
        setStatus("error");
        setError(result.error);
        return;
      }
      setStatus("sent");
    });
  }

  if (status === "sent") {
    return (
      <p role="status" className="text-sm text-neutral-500 dark:text-neutral-400">
        Your landlord has been notified.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100"
      >
        {isPending ? "Requesting…" : "Request access"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
