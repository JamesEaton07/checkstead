// Validates a redirect target came from our own app, not an attacker-crafted
// query string. Without this, `?redirectTo=//evil.com/phish` reaches
// router.push() unchanged — confirmed live that Next.js actually navigates
// the browser to protocol-relative external URLs like that, even though a
// fully-qualified "https://evil.com" is safely ignored. Only a single
// leading "/" (no "//", no backslashes, which some parsers treat the same
// as forward slashes) is accepted; anything else falls back to the default.
export function safeRedirect(path: string | null | undefined, fallback: string): string {
  if (!path) return fallback;
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  if (path.includes("\\")) return fallback;
  return path;
}
