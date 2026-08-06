"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { requestMagicLink } from "@/lib/actions/auth";
import { safeRedirect } from "@/lib/safe-redirect";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get("redirectTo"), "/dashboard");

  const [mode, setMode] = useState<"password" | "magiclink">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      setError("Incorrect email or password.");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleMagicLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    const { error } = await requestMagicLink(email, window.location.origin, redirectTo);

    if (error) {
      setStatus("error");
      setError(error);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700"
      >
        Check <span className="font-medium">{email}</span> for a sign-in link.
        Clicking it will let you set (or reset) your password.
      </div>
    );
  }

  if (mode === "magiclink") {
    return (
      <div className="space-y-4">
        <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="magiclink-email" className="text-sm font-medium">
              Email address
            </label>
            <input
              id="magiclink-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-neutral-500 px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100"
          >
            {status === "sending" ? "Sending link…" : "Send magic link"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setMode("password");
            setError(null);
            setStatus("idle");
          }}
          className="rounded-sm text-sm text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100"
        >
          ← Back to password sign-in
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
            className="w-full rounded-md border border-neutral-500 px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="w-full rounded-md border border-neutral-500 px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100"
        >
          {status === "sending" ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => {
          setMode("magiclink");
          setError(null);
          setStatus("idle");
        }}
        className="rounded-sm text-sm text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100"
      >
        New here, or forgot your password? Email me a sign-in link →
      </button>
    </div>
  );
}
