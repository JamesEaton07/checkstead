// Landlord-entered free text (tenant names, property addresses) gets
// interpolated into raw HTML email strings — escape it first so it can't
// inject markup/scripts into an email sent to someone else (the tenant, or
// the landlord themselves).
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
