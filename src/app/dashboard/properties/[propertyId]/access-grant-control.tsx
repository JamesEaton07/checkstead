"use client";

import { useState, useTransition } from "react";
import type { AccessGrant } from "@/lib/types/database";
import { createAccessGrant, revokeAccessGrant } from "@/lib/actions/access-grants";

export function AccessGrantControl({
  propertyId,
  tenantId,
  grant,
}: {
  propertyId: string;
  tenantId: string;
  grant: AccessGrant | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createAccessGrant(propertyId, tenantId);
      if (result.error) setError(result.error);
    });
  }

  function handleRevoke() {
    if (!grant) return;
    if (
      !window.confirm(
        "Revoke this tenant's access link? It will stop working immediately."
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await revokeAccessGrant(propertyId, grant.id);
      if (result.error) setError(result.error);
    });
  }

  function handleCopy() {
    if (!grant) return;
    const url = `${window.location.origin}/tenant/access/${grant.token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!grant || !grant.active) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-neutral-400">
          {grant ? "Tenant access revoked" : "Tenant access off"}
        </span>
        <button
          onClick={handleCreate}
          disabled={isPending}
          className="text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline disabled:opacity-50"
        >
          {grant ? "Generate new link" : "Enable tenant access"}
        </button>
        {error && <span className="text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-green-700">Tenant access on</span>
      <button
        onClick={handleCopy}
        className="text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
      <button
        onClick={handleRevoke}
        disabled={isPending}
        className="text-red-600 underline-offset-2 hover:text-red-800 hover:underline disabled:opacity-50"
      >
        Revoke
      </button>
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}
