import type { NextConfig } from "next";

// Kept as one string (not an array joined with "; ") so it's easy to diff
// and reason about each directive on its own line.
const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js's hydration/RSC payload relies on inline scripts; without a
  // nonce-based setup (bigger change, more moving parts to keep in sync
  // with middleware) 'unsafe-inline' is required here or the app won't
  // render. Still meaningfully restricts *which* scripts can run compared
  // to no policy at all — script-src only allows same-origin script files.
  // 'unsafe-eval' is dev-only: React's dev-mode debugging tools use eval()
  // for stack-trace reconstruction (never in production, per React itself),
  // so it's added only when NODE_ENV !== "production" rather than weakening
  // the real deployed policy.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  // blob: is for photo-checklist preview thumbnails: URL.createObjectURL()
  // on a File the tenant just picked/compressed client-side, never
  // attacker- or remote-controlled, so this doesn't open up loading
  // arbitrary remote images the way adding a wildcard host would. The
  // Supabase origin is for the landlord-facing baseline photo gallery,
  // which renders <img> tags pointed at short-lived signed Storage URLs.
  "img-src 'self' data: blob: https://xznajmiqvxlwvicseazb.supabase.co",
  "font-src 'self' data:",
  // Same-origin API routes/actions plus the Supabase project itself
  // (auth, database, storage all live under this one origin).
  "connect-src 'self' https://xznajmiqvxlwvicseazb.supabase.co",
  // Modern equivalent of X-Frame-Options — blocks embedding in any iframe,
  // closing the clickjacking vector on /login and /auth/set-password.
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
