import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type {
  TenantAccess,
  TenantBaselineCheckin,
  TenantCheckinPhotoSummary,
} from "@/lib/types/database";
import { RequestAccessButton } from "./request-access-button";
import { PhotoChecklist } from "./photo-checklist";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const supabase = await createClient();
  const { data: access } = await supabase
    .rpc("get_tenant_access", { p_token: token })
    .maybeSingle<TenantAccess>();

  if (!access) return { title: "Link not valid" };
  // Don't put the property address in the title when access is off — this
  // page is shown to someone whose access was intentionally turned off, so
  // keep the browser tab generic rather than confirming property details.
  if (!access.active) return { title: "Access turned off" };
  return { title: access.property_address };
}

// Public route — no Supabase Auth session involved. The token itself is
// the credential; get_tenant_access() validates it and returns the
// single tenant/property it's scoped to, active or not. See
// supabase/migrations/0006 and 0007.
export default async function TenantAccessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: access } = await supabase
    .rpc("get_tenant_access", { p_token: token })
    .maybeSingle<TenantAccess>();

  if (!access) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-md space-y-2">
          <h1 className="text-xl font-semibold">Link not valid</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            This link doesn&apos;t exist. Contact your landlord if you think
            this is a mistake.
          </p>
        </div>
      </main>
    );
  }

  if (!access.active) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-xl font-semibold">Access turned off</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Sorry, please request access from your landlord for further
            accessibility.
          </p>
          <RequestAccessButton token={token} />
        </div>
      </main>
    );
  }

  const { data: checkin } = await supabase
    .rpc("get_tenant_baseline_checkin", { p_token: token })
    .maybeSingle<TenantBaselineCheckin>();

  const { data: photos } = checkin
    ? await supabase.rpc("list_checkin_photos", { p_token: token }).returns<TenantCheckinPhotoSummary[]>()
    : { data: null as TenantCheckinPhotoSummary[] | null };

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16">
      <div className="w-full max-w-lg space-y-8">
        <div>
          <h1 className="text-xl font-semibold">{access.property_address}</h1>
          {access.property_unit_info && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{access.property_unit_info}</p>
          )}
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {access.tenant_name} —{" "}
            <span className="capitalize">{access.lease_status}</span> tenancy
          </p>
        </div>

        {checkin ? (
          <PhotoChecklist
            token={token}
            initialStatus={checkin.status}
            initialPhotos={photos ?? []}
          />
        ) : (
          <div className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-500 dark:text-neutral-400">
            Your reliability record will show up here once that feature is
            built. This page is scoped to your own tenancy only — nothing
            before your lease started, nothing after it ends, and nothing
            from other tenants.
          </div>
        )}
      </div>
    </main>
  );
}
