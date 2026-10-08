"use client";

type ClientErrorPayload = {
  source: "client" | "react";
  name?: string;
  message: string;
  stack?: string;
  digest?: string;
  path?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

const reportedFingerprints = new Set<string>();

function fingerprint(payload: ClientErrorPayload) {
  return [
    payload.source,
    payload.name ?? "",
    payload.message,
    payload.stack?.split("\n").slice(0, 3).join("\n") ?? "",
    payload.path ?? "",
  ].join("|");
}

export function reportClientError(payload: ClientErrorPayload) {
  if (process.env.NODE_ENV !== "production") return;

  const key = fingerprint(payload);
  if (reportedFingerprints.has(key)) return;
  reportedFingerprints.add(key);

  if (reportedFingerprints.size > 50) {
    const first = reportedFingerprints.values().next().value;
    if (first) reportedFingerprints.delete(first);
  }

  void fetch("/api/error-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
    cache: "no-store",
  }).catch(() => {
    // Error reporting must never break the customer experience.
  });
}
