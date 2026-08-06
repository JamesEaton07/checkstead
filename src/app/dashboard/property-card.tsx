"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/button";
import type { Property } from "@/lib/types/database";
import { deleteProperty, updateProperty } from "@/lib/actions/properties";

export function PropertyCard({ property }: { property: Property }) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpdate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateProperty(property.id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsEditing(false);
    });
  }

  function handleDelete() {
    if (
      !window.confirm(
        `Remove ${property.address}? This can't be undone and will remove its tenants too.`
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteProperty(property.id);
      if (result.error) setError(result.error);
    });
  }

  if (isEditing) {
    return (
      <div className="rounded-lg border border-neutral-200 p-4">
        <form action={handleUpdate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium">Address</label>
            <input
              name="address"
              defaultValue={property.address}
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium">Unit info</label>
            <input
              name="unit_info"
              defaultValue={property.unit_info ?? ""}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              Save
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-4">
      <div>
        <Link
          href={`/dashboard/properties/${property.id}`}
          className="font-medium hover:underline"
        >
          {property.address}
        </Link>
        {property.unit_info && (
          <p className="text-sm text-neutral-500">{property.unit_info}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
          Remove
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
