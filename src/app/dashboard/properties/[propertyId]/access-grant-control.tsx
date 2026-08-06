"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/button";
import type { AccessGrant } from "@/lib/types/database";
import {
  createAccessGrant,
  expireAccessGrant,
  sendAccessLinkEmail,
  toggleTenantAccess,
} from "@/lib/actions/access-grants";

export function AccessGrantControl({
  propertyId,
  tenantId,
  tenantAccessEnabled,
  grant,
}: {
  propertyId: string;
  tenantId: string;
  tenantAccessEnabled: boolean;
  grant: AccessGrant | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleTenantAccess(propertyId, tenantId, !tenantAccessEnabled);
      if (result.error) setError(result.error);
    });
  }

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createAccessGrant(propertyId, tenantId);
      if (result.error) setError(result.error);
    });
  }

  function handleExpire() {
    if (!grant) return;
    if (
      !window.confirm(
        "Expire this tenant's link? It will stop working immediately and can't be reactivated — you'd need to generate a new one."
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await expireAccessGrant(propertyId, grant.id);
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

  function handleSend() {
    if (!grant) return;
    if (
      !tenantAccessEnabled &&
      !window.confirm(
        "Tenant access is currently off — they won't be able to use this link until you turn it back on. Send anyway?"
      )
    ) {
      return;
    }
    setError(null);
    setSent(false);
    startTransition(async () => {
      const result = await sendAccessLinkEmail(
        propertyId,
        tenantId,
        grant.id,
        window.location.origin
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {grant && (
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
            tenantAccessEnabled
              ? "bg-green-100 text-green-800 hover:bg-green-200"
              : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
          }`}
        >
          Tenant access: {tenantAccessEnabled ? "On" : "Off"}
        </button>
      )}

      {!grant || !grant.active ? (
        <Button size="sm" onClick={handleCreate} disabled={isPending}>
          {grant ? "Generate new link" : "Generate link"}
        </Button>
      ) : (
        <>
          <Button size="sm" onClick={handleSend} disabled={isPending}>
            {sent ? "Sent!" : "Send link to tenant"}
          </Button>
          <Button size="sm" variant="secondary" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy link"}
          </Button>
          <Button size="sm" variant="destructive" onClick={handleExpire} disabled={isPending}>
            Expire link
          </Button>
          {!tenantAccessEnabled && (
            <span className="text-xs text-neutral-400">
              Link won&apos;t work until access is turned on
            </span>
          )}
        </>
      )}

      {error && <span className="w-full text-xs text-red-600">{error}</span>}
    </div>
  );
}
