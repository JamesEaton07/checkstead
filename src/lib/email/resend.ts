// App-triggered transactional emails (access-link invites, access-request
// notifications) sent directly via Resend's API. Distinct from Supabase
// Auth's own SMTP config (supabase/config.toml [auth.email.smtp]), which
// only handles Supabase's own login emails (magic link, etc.) — this is for
// everything else the app itself needs to send.
const FROM_ADDRESS = "Checkstead <noreply@checksteadapp.com>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ error: string | null }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { error: "Email delivery isn't configured (missing RESEND_API_KEY)." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  });

  if (!response.ok) {
    const body = await response.text();
    // Logged server-side only — the caller-facing error stays generic so
    // internal delivery/config details never reach the browser, but this
    // makes the real cause (bad key, unverified domain, etc.) visible in
    // server logs instead of requiring a live repro to diagnose.
    console.error(`Resend send failed (${response.status}): ${body}`);
    return { error: `Failed to send email (${response.status}): ${body}` };
  }

  return { error: null };
}
