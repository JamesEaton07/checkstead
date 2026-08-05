import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Checkstead
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-neutral-600 hover:text-neutral-900">
              Properties
            </Link>
            <Link
              href="/dashboard/settings"
              className="text-neutral-600 hover:text-neutral-900"
            >
              Settings
            </Link>
            <span className="text-neutral-300">|</span>
            <span className="text-neutral-500">{user.email}</span>
            <form action={signOut.bind(null, "/login")}>
              <button
                type="submit"
                className="text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
