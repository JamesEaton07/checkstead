import { Suspense } from "react";
import type { Metadata } from "next";
import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = {
  title: "Set your password",
};

export default function SetPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Set your password</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            You&apos;re signed in via email link. Set a password now so you can
            sign in directly next time.
          </p>
        </div>

        <Suspense fallback={null}>
          <SetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
