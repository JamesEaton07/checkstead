"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { requestMagicLink } from "@/lib/actions/auth";

export function TenantLoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/tenant";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    const { error } = await requestMagicLink(
      email,
      "tenant",
      window.location.origin,
      redirectTo
    );

    if (error) {
      setStatus("error");
      setError(error);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
        Check <span className="font-medium">{email}</span> for a sign-in link. You
        can close this tab.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {status === "sending" ? "Sending link…" : "Send magic link"}
      </button>

      <p className="text-xs text-neutral-400">
        Checkstead is a property condition and rent-reliability tracker your
        landlord uses. This sign-in is a placeholder — it isn&apos;t scoped to a
        specific tenancy yet, so don&apos;t rely on it for anything private.
      </p>
    </form>
  );
}
