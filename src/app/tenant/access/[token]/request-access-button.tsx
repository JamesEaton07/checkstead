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
      <p className="text-sm text-neutral-500">
        Your landlord has been notified.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {isPending ? "Requesting…" : "Request access"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
