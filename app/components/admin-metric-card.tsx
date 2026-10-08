"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";

export function AdminMetricCard({
  label, value, icon, hint, index = 0,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  hint?: string;
  index?: number;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="min-w-0"
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 4) * 0.045 }}
    >
      <Card className="admin-modern-metric h-full">
        <CardContent className="flex h-full flex-col justify-between gap-5 p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="admin-modern-metric-label">{label}</span>
            <span className="admin-modern-metric-icon" aria-hidden>{icon}</span>
          </div>
          <div>
            <div className="admin-modern-metric-value">{typeof value === "number" ? value.toLocaleString("en-AU") : value}</div>
            {hint && <p className="admin-modern-metric-hint">{hint}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
