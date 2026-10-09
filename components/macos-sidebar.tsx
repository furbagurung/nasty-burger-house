"use client";

import { PlusSignIcon, SidebarLeftIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";

export type MacOSSidebarNavigationItem = {
  label: string;
  href: string;
  icon: ReactNode;
  group?: string;
};

export interface MacOSSidebarProps {
  items?: string[];
  defaultOpen?: boolean;
  initialSelectedIndex?: number;
  children?: ReactNode;
  className?: string;
  /** Real navigation instead of the original Canvas-demo layout. */
  navigationItems?: MacOSSidebarNavigationItem[];
  activeHref?: string;
  header?: ReactNode;
  footer?: ReactNode;
}

export function MacOSSidebar({
  items = [],
  defaultOpen = true,
  initialSelectedIndex = 0,
  children,
  className = "",
  navigationItems,
  activeHref,
  header,
  footer,
}: MacOSSidebarProps) {
  const reducedMotion = useReducedMotion();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] =
    useState<number>(initialSelectedIndex);
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  // Production navigation mode: accessible links and active routes, rather
  // than the demo's local-only selected index. Mobile uses the shadcn Sheet.
  if (navigationItems) {
    return (
      <motion.aside
        aria-label="Admin workspace sidebar"
        data-collapsed={!isOpen}
        className={`admin-macos-sidebar ${className}`}
        initial={false}
        animate={{ width: isOpen ? "15.5rem" : "5.25rem" }}
        transition={reducedMotion ? { duration: 0 } : { type: "spring", bounce: 0.12, duration: 0.38 }}
      >
        <div className="admin-macos-sidebar__top">
          {isOpen && <div className="admin-macos-sidebar__brand">{header}</div>}
          <div className="admin-macos-sidebar__toolbar">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="admin-macos-sidebar__toggle"
              aria-label={isOpen ? "Collapse admin sidebar" : "Expand admin sidebar"}
              aria-expanded={isOpen}
              onClick={() => setIsOpen((open) => !open)}
            >
              <HugeiconsIcon icon={SidebarLeftIcon} className="size-5" />
            </Button>
          </div>
        </div>
        <nav className="admin-macos-sidebar__navigation" aria-label="Admin sections">
          {navigationItems.map((item, index) => {
            const active = activeHref === item.href;
            const startsGroup = index === 0 || navigationItems[index - 1]?.group !== item.group;
            return (
              <div
                key={item.href}
                className={`admin-macos-sidebar__nav-entry${startsGroup ? " is-group-start" : ""}`}
              >
                {isOpen && startsGroup && item.group && (
                  <p className="admin-jobtracker-nav-label">{item.group}</p>
                )}
                <Link
                href={item.href}
                title={!isOpen ? item.label : undefined}
                aria-label={!isOpen ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={`admin-macos-sidebar__link${active ? " is-current" : ""}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <AnimatePresence>
                  {active && (
                    <motion.span
                      className="admin-macos-sidebar__selection"
                      initial={false}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reducedMotion ? 0 : 0.18 }}
                      aria-hidden="true"
                    />
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {hoveredIndex === index && !active && (
                    <motion.span
                      layoutId="admin-macos-sidebar-hover"
                      className="admin-macos-sidebar__hover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reducedMotion ? 0 : 0.16 }}
                      aria-hidden="true"
                    />
                  )}
                </AnimatePresence>
                <span className="admin-macos-sidebar__link-icon" aria-hidden="true">{item.icon}</span>
                {isOpen && <span className="admin-macos-sidebar__link-text">{item.label}</span>}
              </Link>
              </div>
            );
          })}
        </nav>
        <div className="admin-macos-sidebar__footer">{footer}</div>
      </motion.aside>
    );
  }

  return (
    <div
      className={`flex bg-neutral-200 dark:bg-neutral-900 rounded-3xl p-3 relative w-full sm:min-w-[480px] overflow-hidden ${className}`}
    >
      <motion.div
        animate={{
          width: isOpen ? 240 : 64,
        }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
        className={`p-2 rounded-2xl shrink-0 flex flex-col items-start transition-colors duration-900 ease-out ${
          isOpen ? "bg-neutral-100 dark:bg-neutral-800" : "bg-transparent"
        }`}
      >
        <div
          className={`flex items-center w-full ${
            isOpen ? "justify-end gap-4" : "justify-center"
          } text-neutral-700 dark:text-neutral-300 p-2 shrink-0`}
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <HugeiconsIcon
                  icon={PlusSignIcon}
                  className="size-5 cursor-pointer"
                />
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            layout
            className="shrink-0 flex items-center justify-center"
          >
            <HugeiconsIcon
              icon={SidebarLeftIcon}
              className="size-5 cursor-pointer"
              onClick={() => setIsOpen(!isOpen)}
            />
          </motion.div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col gap-2 mt-4 w-full relative z-10 whitespace-nowrap"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {items.map((item, index) => (
                <div
                  key={item}
                  className="relative cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onClick={() => setSelectedIndex(index)}
                >
                  <AnimatePresence>
                    {selectedIndex === index && (
                      <motion.div
                        className="absolute inset-0 z-0 bg-neutral-200 dark:bg-neutral-700 rounded-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      />
                    )}
                  </AnimatePresence>
                  <p
                    className={`relative z-10 px-5 py-3 tracking-tight ${
                      selectedIndex === index
                        ? "text-neutral-900 dark:text-neutral-100 font-medium"
                        : "text-neutral-700 dark:text-neutral-200/50"
                    }`}
                  >
                    {item}
                  </p>
                  <AnimatePresence>
                    {hoveredIndex === index && selectedIndex !== index && (
                      <motion.span
                        layoutId="sidebar-hover-bg"
                        className="absolute inset-0 z-0 bg-neutral-200/50 dark:bg-neutral-900/50 rounded-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 30,
                        }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="flex-1 w-full h-full min-h-full overflow-y-auto z-0 pl-4 lg:pl-8">
        {children}
      </div>
    </div>
  );
}
