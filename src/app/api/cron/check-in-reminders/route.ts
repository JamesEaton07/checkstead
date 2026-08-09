import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape-html";

// Runs on Vercel Cron (see vercel.json) — never called by a browser, so
// it's gated on a shared secret rather than a Supabase Auth session.
// Vercel sends this exact header automatically for scheduled invocations
// when CRON_SECRET is set as a project env var.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: dueTenants, error } = await supabase.rpc("process_due_checkins");

  if (error) {
    console.error("process_due_checkins failed:", error);
    return Response.json({ error: "Failed to process due check-ins." }, { status: 500 });
  }

  const { origin: siteUrl } = new URL(request.url);
  let tenantEmailsSent = 0;
  let landlordEmailsSent = 0;

  for (const due of dueTenants ?? []) {
    const safePropertyLine = escapeHtml(
      due.property_unit_info ? `${due.property_address}, ${due.property_unit_info}` : due.property_address
    );
    const safeTenantName = escapeHtml(due.tenant_name);

    if (due.access_token && due.tenant_contact) {
      const url = `${siteUrl}/tenant/access/${due.access_token}`;
      const { error: tenantEmailError } = await sendEmail({
        to: due.tenant_contact,
        subject: `A check-in is due for ${due.property_address}`,
        html: `
          <p>Hi ${safeTenantName},</p>
          <p>It's time for your scheduled check-in at ${safePropertyLine}. Please submit
          a few photos when you get a chance.</p>
          <p><a href="${url}">${url}</a></p>
        `,
      });
      if (tenantEmailError) {
        console.error(`Tenant reminder failed for ${due.tenant_id}:`, tenantEmailError);
      } else {
        tenantEmailsSent++;
      }
    }

    if (due.landlord_notify_email && due.landlord_email) {
      const { error: landlordEmailError } = await sendEmail({
        to: due.landlord_email,
        subject: `Check-in due: ${safeTenantName} at ${due.property_address}`,
        html: `
          <p>${safeTenantName}'s scheduled check-in date has arrived for ${safePropertyLine}.</p>
        `,
      });
      if (landlordEmailError) {
        console.error(`Landlord reminder failed for ${due.tenant_id}:`, landlordEmailError);
      } else {
        landlordEmailsSent++;
      }
    }
  }

  return Response.json({
    processed: dueTenants?.length ?? 0,
    tenantEmailsSent,
    landlordEmailsSent,
  });
}
