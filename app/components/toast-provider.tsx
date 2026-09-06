"use client";

import { Check, CircleAlert, Info, X } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  NASTY_TOAST_EVENT,
  type NastyToastPayload,
  type NastyToastVariant,
} from "../lib/toast";

type ToastItem = Required<Pick<NastyToastPayload, "id" | "title" | "variant" | "duration">> &
  Omit<NastyToastPayload, "id" | "title" | "variant" | "duration">;

const DEFAULT_DURATION = 3800;

function ToastIcon({ variant }: { variant: NastyToastVariant }) {
  if (variant === "error") return <CircleAlert size={18} strokeWidth={2.1} aria-hidden="true" />;
  if (variant === "info") return <Info size={18} strokeWidth={2.1} aria-hidden="true" />;
  return <Check size={18} strokeWidth={2.3} aria-hidden="true" />;
}

export default function ToastProvider() {
  const pathname = usePathname();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (payload: NastyToastPayload) => {
      if (!payload?.title) return;

      const id = payload.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const duration = Math.max(1800, payload.duration ?? DEFAULT_DURATION);
      const toast: ToastItem = {
        ...payload,
        id,
        duration,
        variant: payload.variant ?? "info",
        title: payload.title,
      };

      const previousTimer = timers.current.get(id);
      if (previousTimer) window.clearTimeout(previousTimer);

      setToasts((current) => [...current.filter((item) => item.id !== id), toast].slice(-3));

      const timer = window.setTimeout(() => dismissToast(id), duration);
      timers.current.set(id, timer);
    },
    [dismissToast],
  );

  useEffect(() => {
    if (pathname === "/cart") dismissToast("cart-updated");
  }, [pathname, dismissToast]);

  useEffect(() => {
    function handleToast(event: Event) {
      const customEvent = event as CustomEvent<NastyToastPayload>;
      addToast(customEvent.detail);
    }

    function handleCartUpdated() {
      if (window.location.pathname === "/cart") return;

      addToast({
        id: "cart-updated",
        title: "Added to your order",
        description: "Your cart has been updated.",
        variant: "success",
        actionLabel: "View cart",
        actionHref: "/cart",
      });
    }

    window.addEventListener(NASTY_TOAST_EVENT, handleToast);
    window.addEventListener("nasty-cart-updated", handleCartUpdated);

    return () => {
      window.removeEventListener(NASTY_TOAST_EVENT, handleToast);
      window.removeEventListener("nasty-cart-updated", handleCartUpdated);
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="nasty-toast-viewport" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <article
          className={`nasty-toast nasty-toast--${toast.variant}`}
          key={toast.id}
          role={toast.variant === "error" ? "alert" : "status"}
          style={{ "--nasty-toast-duration": `${toast.duration}ms` } as CSSProperties}
        >
          <span className="nasty-toast__icon">
            <ToastIcon variant={toast.variant} />
          </span>

          <div className="nasty-toast__content">
            <strong>{toast.title}</strong>
            {toast.description && <span>{toast.description}</span>}
            {toast.actionHref && toast.actionLabel && (
              <a className="nasty-toast__action" href={toast.actionHref}>
                {toast.actionLabel}
                <span aria-hidden="true">→</span>
              </a>
            )}
          </div>

          <button
            className="nasty-toast__close"
            type="button"
            aria-label="Dismiss notification"
            onClick={() => dismissToast(toast.id)}
          >
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>

          <span className="nasty-toast__progress" aria-hidden="true" />
        </article>
      ))}
    </div>
  );
}
