"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * One saved appearance preference shared by customer pages and admin.
 * Default is light so existing page design does not change on upgrade.
 * Both surfaces use <html class="dark"> when a user selects Dark.
 */
export default function AppearanceProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="nasty-burger-appearance"
    >
      {children}
    </ThemeProvider>
  );
}
