"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonWithIconTone = "light" | "red" | "dark" | "gold";

type ButtonWithIconProps = {
  children: ReactNode;
  href?: string;
  tone?: ButtonWithIconTone;
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  ariaLabel?: string;
};

const toneClasses: Record<ButtonWithIconTone, string> = {
  light: "bg-white text-foreground border border-black/10",
  red: "bg-[var(--hot)] text-white border border-white/10",
  dark: "bg-[var(--ink)] text-white border border-white/10",
  gold: "bg-[var(--gold)] text-[var(--ink)] border border-black/10",
};

const chipClasses: Record<ButtonWithIconTone, string> = {
  light: "bg-[var(--ink)] text-white",
  red: "bg-white text-[var(--ink)]",
  dark: "bg-white text-[var(--ink)]",
  gold: "bg-[var(--ink)] text-white",
};

export default function ButtonWithIcon({
  children,
  href,
  tone = "light",
  fullWidth = false,
  className,
  disabled = false,
  type = "button",
  onClick,
  ariaLabel,
}: ButtonWithIconProps) {
  const rootClassName = cn(
    "relative group inline-flex h-12 items-center overflow-hidden rounded-full p-1 ps-6 pe-14 text-sm font-medium no-underline shadow-sm transition-all duration-500 hover:ps-14 hover:pe-6",
    fullWidth ? "w-full" : "w-fit",
    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
    toneClasses[tone],
    className,
  );

  const content = (
    <>
      <span className="relative z-10 transition-all duration-500">{children}</span>
      <span
        className={cn(
          "absolute right-1 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45",
          chipClasses[tone],
        )}
        aria-hidden="true"
      >
        <ArrowUpRight size={16} />
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        className={rootClassName}
        href={href}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          onClick?.();
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <Button
      className={rootClassName}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {content}
    </Button>
  );
}
