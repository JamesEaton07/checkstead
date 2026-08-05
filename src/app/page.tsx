import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div className="max-w-lg space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight">Checkstead</h1>
        <p className="text-lg text-neutral-600">
          Track property condition over time and keep a private reliability
          record per tenant — without a full rent-collection suite.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
        >
          Sign in as a landlord
        </Link>
      </div>
    </main>
  );
}
