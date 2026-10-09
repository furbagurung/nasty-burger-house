"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

type MetricTone = "brand" | "neutral";

export function AdminMetricCard({
  label,
  value,
  icon,
  hint,
  trend,
  tone = "neutral",
  index = 0,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  hint?: string;
  /** Percentage change; null means no meaningful comparison baseline. */
  trend?: number | null;
  tone?: MetricTone;
  index?: number;
}) {
  const reducedMotion = useReducedMotion();
  const formattedValue =
    typeof value === "number" ? value.toLocaleString("en-AU") : value;
  const trendState =
    trend === undefined
      ? undefined
      : trend === null
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
    trend === null
      ? "No prior baseline"
      : trend === undefined
        ? ""
        : `${trend > 0.05 ? "+" : trend < -0.05 ? "−" : ""}${Math.abs(trend) < 0.05 ? "0.0" : Math.abs(trend).toFixed(1)}%`;

  return (
    <motion.div
      className="min-w-0"
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index, 4) * 0.035 }}
    >
      <Card className="admin-modern-metric h-full" size="sm" data-tone={tone}>
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
          {trendState !== undefined && (
            <div className="admin-modern-metric-trend-row">
              <Badge
                variant="secondary"
                className={`admin-modern-metric-trend is-${trendState}`}
              >
                {trend !== null && <TrendIcon aria-hidden="true" />}
                {trendText}
              </Badge>
              {trend !== null && (
                <span className="admin-modern-metric-comparison">
                  vs previous 30 days
                </span>
              )}
            </div>
          )}
          {hint && <p className="admin-modern-metric-hint">{hint}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}
