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
  ghost: "text-neutral-600 hover:text-neutral-900 underline-offset-2 hover:underline",
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
  const base =
    variant === "ghost"
      ? "font-medium transition disabled:opacity-50"
      : "rounded-md font-medium transition disabled:opacity-50";

  return (
    <button
      className={`${base} ${VARIANT_CLASSES[variant]} ${variant === "ghost" ? "" : SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  );
}
