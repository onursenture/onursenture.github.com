import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { isExternal } from "./text-link";

// primary: inverted fill. ghost: 1px line outline (Figma "Outline",
// e.g. "Book a call →"). text: no frame (Figma "Text", e.g. "Menu").
export type ButtonVariant = "primary" | "ghost" | "text";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-fg text-bg hover:underline",
  ghost: "border border-line text-fg hover:border-fg",
  text: "text-fg hover:underline",
};

export function buttonClass(variant: ButtonVariant = "ghost", className?: string): string {
  return cx(
    "inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-control px-3 type-body font-medium whitespace-nowrap",
    VARIANTS[variant],
    className,
  );
}

export function Button({
  variant,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

// A link that looks like a button. External links get the same rel as
// TextLink.
export function ButtonLink({
  href,
  variant,
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  const classes = buttonClass(variant, className);
  return isExternal(href) ? (
    <a href={href} rel="noopener noreferrer" className={classes}>
      {children}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
