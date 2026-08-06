"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/button";
import type { AccessGrant, Tenant } from "@/lib/types/database";
import { removeTenant } from "@/lib/actions/tenants";
import { AccessGrantControl } from "./access-grant-control";

export function TenantRow({
  propertyId,
  tenant,
  grant,
}: {
  propertyId: string;
  tenant: Tenant;
  grant: AccessGrant | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    if (!window.confirm(`Remove tenant ${tenant.name}?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await removeTenant(propertyId, tenant.id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{tenant.name}</p>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            {tenant.contact && <span>{tenant.contact}</span>}
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs capitalize text-neutral-600">
              {tenant.lease_status}
            </span>
          </div>
        </div>
        <Button size="sm" variant="destructive" onClick={handleRemove} disabled={isPending}>
          Remove
        </Button>
      </div>
      <AccessGrantControl
        propertyId={propertyId}
        tenantId={tenant.id}
        tenantAccessEnabled={tenant.tenant_access_enabled}
        grant={grant}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
