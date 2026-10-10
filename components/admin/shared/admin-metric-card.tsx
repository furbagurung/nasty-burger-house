"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription } from "@/components/ui/card";

export type AdminMetricTone = "brand" | "comparison" | "success" | "warning" | "neutral";

export function AdminMetricCard({
  label,
  value,
  icon,
  hint,
  trend,
  comparisonLabel = "vs prior 30d",
  tone = "neutral",
  index = 0,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  hint?: string;
  /** Percentage change compared with the previous period; null means no baseline. */
  trend?: number | null;
  comparisonLabel?: string;
  tone?: AdminMetricTone;
  index?: number;
}) {
  const reducedMotion = useReducedMotion();
  const formattedValue =
    typeof value === "number" ? value.toLocaleString("en-AU") : value;

  const trendState =
    trend === undefined
      ? undefined
      : trend === null || !Number.isFinite(trend)
        ? "unknown"
        : Math.abs(trend) < 0.05
          ? "flat"
          : trend > 0
            ? "up"
            : "down";

  const TrendIcon =
    trendState === "up"
      ? ArrowUpRight
      : trendState === "down"
        ? ArrowDownRight
        : ArrowRight;

  const trendText =
    trendState === "unknown"
      ? "No baseline"
      : trend === undefined
        ? ""
        : typeof trend !== "number" || !Number.isFinite(trend)
          ? "No baseline"
          : `${trend > 0.05 ? "+" : trend < -0.05 ? "−" : ""}${Math.abs(trend) < 0.05 ? "0.0" : Math.abs(trend).toFixed(1)}%`;

  return (
    <motion.div
      className="admin-kpi-cell min-w-0"
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index, 4) * 0.035 }}
    >
      <Card size="sm" className="admin-kpi-card h-full" data-tone={tone}>
        <CardContent className="admin-kpi-content">
          <div className="admin-kpi-heading">
            <span className="admin-kpi-icon" aria-hidden="true">
              {icon}
            </span>
            <strong className="admin-kpi-value">{formattedValue}</strong>
          </div>
          <div className="admin-kpi-details">
            <CardDescription className="admin-kpi-label">{label}</CardDescription>
            {trendState !== undefined && (
              <div className="admin-kpi-trend-row">
                <Badge
                  variant="secondary"
                  className={`admin-kpi-trend is-${trendState}`}
                >
                  {trendState !== "unknown" && <TrendIcon aria-hidden="true" />}
                  {trendText}
                </Badge>
                {trendState !== "unknown" && (
                  <span className="admin-kpi-comparison">{comparisonLabel}</span>
                )}
              </div>
            )}
            {hint && <p className="admin-kpi-hint">{hint}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
