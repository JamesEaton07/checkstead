"use client";

import { useRef, useState, useTransition } from "react";
import { createProperty } from "@/lib/actions/properties";

export function AddPropertyForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createProperty(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-1.5">
        <label htmlFor="address" className="text-sm font-medium">
          Address
        </label>
        <input
          id="address"
          name="address"
          required
          placeholder="123 Main St, Springfield"
          className="w-full rounded-md border border-neutral-500 px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
        />
      </div>
      <div className="flex-1 space-y-1.5">
        <label htmlFor="unit_info" className="text-sm font-medium">
          Unit info (optional)
        </label>
        <input
          id="unit_info"
          name="unit_info"
          placeholder="Unit 2B"
          className="w-full rounded-md border border-neutral-500 px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100"
      >
        {isPending ? "Adding…" : "Add property"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400 sm:basis-full">
          {error}
        </p>
      )}
    </form>
  );
}
