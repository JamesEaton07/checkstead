import type { ButtonHTMLAttributes } from "react";

// Mutating actions (submit, delete, toggle, generate...) get a real button
// background so they read as clickable controls. Reserve "ghost" for
// non-mutating navigation — back links, mode switches — where a background
// would be visual noise.
export type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
export type ButtonSize = "sm" | "md";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-neutral-900 text-white hover:bg-neutral-700",
  secondary: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
  destructive: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
  ghost: "text-neutral-600 hover:text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-400 dark:hover:text-neutral-100",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-4 py-2 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  // The browser's own default focus outline only reaches ~1.9:1 contrast
  // against this app's dark-mode background (#0a0a0a) — well under the
  // 3:1 WCAG minimum for a focus indicator — so every variant gets an
  // explicit, theme-aware ring instead of relying on it.
  const focusRing =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-neutral-100";
  const base =
    variant === "ghost"
      ? `font-medium transition disabled:opacity-50 ${focusRing}`
      : `rounded-md font-medium transition disabled:opacity-50 ${focusRing}`;

  return (
    <button
      className={`${base} ${VARIANT_CLASSES[variant]} ${variant === "ghost" ? "" : SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  );
}
