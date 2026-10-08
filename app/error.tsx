"use client";

import { useEffect } from "react";

import { reportClientError } from "./lib/client-error-reporting";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      source: "react",
      name: error.name,
      message: error.message || "A page failed to render",
      stack: error.stack,
      digest: error.digest,
      path: window.location.pathname,
      userAgent: navigator.userAgent,
      metadata: {
        boundary: "app/error",
      },
    });
  }, [error]);

  return (
    <main
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background: "#fff",
        color: "#171513",
      }}
    >
      <div style={{ maxWidth: "34rem", textAlign: "center" }}>
        <p style={{ margin: 0, color: "#c8102e", fontWeight: 800 }}>
          Nasty Burger House
        </p>
        <h1 style={{ margin: "0.5rem 0 0", fontSize: "2rem" }}>
          Something went wrong
        </h1>
        <p style={{ color: "#716a62", lineHeight: 1.6 }}>
          We&apos;ve been notified automatically. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: "2.75rem",
            border: 0,
            borderRadius: "999px",
            padding: "0 1.25rem",
            background: "#c8102e",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
