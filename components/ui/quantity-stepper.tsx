"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { HiMinus, HiPlus } from "react-icons/hi";
import { useState } from "react";

export type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label?: string;
  className?: string;
  size?: "compact" | "regular";
  disabled?: boolean;
  disableIncrement?: boolean;
  disableDecrement?: boolean;
};

/**
 * Compact Nasty Burger adaptation of Watermelon UI's motion Stepper.
 * A controlled quantity is the source of truth: cart and food customisation
 * continue to own their existing state and pricing logic.
 */
export function QuantityStepper({
  value,
  min = 0,
  max = 20,
  onChange,
  label = "Quantity",
  className = "",
  size = "compact",
  disabled = false,
  disableIncrement = false,
  disableDecrement = false,
}: QuantityStepperProps) {
  const [direction, setDirection] = useState(1);
  const reducedMotion = useReducedMotion();
  const canDecrease = !disabled && !disableDecrement && value > min;
  const canIncrease = !disabled && !disableIncrement && value < max;

  function step(delta: -1 | 1) {
    const next = Math.max(min, Math.min(max, value + delta));
    if (disabled || next === value) return;
    if (delta < 0 && disableDecrement) return;
    if (delta > 0 && disableIncrement) return;
    setDirection(delta);
    onChange(next);
  }

  return (
    <div
      className={["nbh-quantity-stepper", `nbh-quantity-stepper--${size}`, className]
        .filter(Boolean)
        .join(" ")}
      role="group"
      aria-label={label}
    >
      <motion.button
        type="button"
        className="nbh-quantity-stepper__button nbh-quantity-stepper__minus"
        aria-label={`Decrease ${label.toLowerCase()}`}
        disabled={!canDecrease}
        onClick={() => step(-1)}
        whileTap={reducedMotion ? undefined : { scale: 0.9 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
      >
        <HiMinus aria-hidden="true" />
      </motion.button>

      <span className="nbh-quantity-stepper__value" aria-live="off">
        <AnimatePresence initial={false} mode="popLayout" custom={direction}>
          <motion.span
            key={value}
            custom={direction}
            initial={reducedMotion ? false : { y: direction > 0 ? 14 : -14, opacity: 0, scale: 0.7 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reducedMotion ? undefined : (dir: number) => ({
              y: dir > 0 ? -14 : 14,
              opacity: 0,
              scale: 0.7,
            })}
            transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 22 }}
            className="nbh-quantity-stepper__digit"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </span>

      <motion.button
        type="button"
        className="nbh-quantity-stepper__button nbh-quantity-stepper__plus"
        aria-label={`Increase ${label.toLowerCase()}`}
        disabled={!canIncrease}
        onClick={() => step(1)}
        whileTap={reducedMotion ? undefined : { scale: 0.9 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
      >
        <HiPlus aria-hidden="true" />
      </motion.button>
    </div>
  );
}
