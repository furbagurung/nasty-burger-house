"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

/** Shared accessible Light/Dark toggle for customer + admin controls. */
export default function ThemeToggle({
  className = "",
  showLabel = false,
  variant = "button",
}: {
  className?: string;
  showLabel?: boolean;
  variant?: "button" | "switch";
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  if (variant === "switch") {
    return (
      <div className={`nb-theme-switch ${className}`} title={label}>
        <Sun size={16} aria-hidden="true" data-active={!isDark} />
        <Switch
          aria-label="Dark mode"
          checked={isDark}
          disabled={!mounted}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        />
        <Moon size={16} aria-hidden="true" data-active={isDark} />
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      className={`nb-theme-toggle ${showLabel ? "nb-theme-toggle--menu " : ""}${className}`}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      {showLabel && <span>{isDark ? "Light appearance" : "Dark appearance"}</span>}
    </Button>
  );
}
