export const NASTY_TOAST_EVENT = "nasty-toast";

export type NastyToastVariant = "success" | "error" | "info";

export type NastyToastPayload = {
  id?: string;
  title: string;
  description?: string;
  variant?: NastyToastVariant;
  duration?: number;
  actionLabel?: string;
  actionHref?: string;
};

export function showToast(payload: NastyToastPayload) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<NastyToastPayload>(NASTY_TOAST_EVENT, {
      detail: payload,
    }),
  );
}
