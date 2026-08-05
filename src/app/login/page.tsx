import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Checkstead</h1>
          <p className="text-sm text-neutral-500">Landlord sign-in.</p>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-neutral-400">
          Tenant?{" "}
          <Link href="/tenant/login" className="underline-offset-2 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </main>
  );
}
