"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

export function AdminMetricCard({
  label,
  value,
  icon,
  hint,
  index = 0,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  hint?: string;
  index?: number;
}) {
  const reducedMotion = useReducedMotion();
  const formattedValue =
    typeof value === "number" ? value.toLocaleString("en-AU") : value;

  return (
    <motion.div
      className="min-w-0"
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index, 4) * 0.035 }}
    >
      <Card className="admin-modern-metric h-full" size="sm">
        <CardHeader className="admin-modern-metric-header">
          <CardDescription className="admin-modern-metric-label">
            {label}
          </CardDescription>
          <CardAction>
            <span className="admin-modern-metric-icon" aria-hidden="true">
              {icon}
            </span>
          </CardAction>
        </CardHeader>
        <CardContent className="admin-modern-metric-content">
          <strong className="admin-modern-metric-value">{formattedValue}</strong>
          {hint && <p className="admin-modern-metric-hint">{hint}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}
