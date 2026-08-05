import { Suspense } from "react";
import { TenantLoginForm } from "./tenant-login-form";

export default function TenantLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Checkstead</h1>
          <p className="text-sm text-neutral-500">
            Tenant sign-in — enter your email for a one-time link. No password.
          </p>
        </div>

        <Suspense fallback={null}>
          <TenantLoginForm />
        </Suspense>
      </div>
    </main>
  );
}
