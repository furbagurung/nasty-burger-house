"use client";

import { useEffect } from "react";

import { reportClientError } from "../lib/client-error-reporting";

function errorFromReason(reason: unknown) {
  if (reason instanceof Error) {
    return {
      name: reason.name,
      message: reason.message || "Unhandled promise rejection",
      stack: reason.stack,
    };
  }

  if (typeof reason === "string") {
    return {
      name: "UnhandledRejection",
      message: reason,
      stack: undefined,
    };
  }

  try {
    return {
      name: "UnhandledRejection",
      message: JSON.stringify(reason),
      stack: undefined,
    };
  } catch {
    return {
      name: "UnhandledRejection",
      message: "Unknown unhandled promise rejection",
      stack: undefined,
    };
  }
}

export default function ErrorMonitorClient() {
  useEffect(() => {
    const currentPath = () => window.location.pathname;

    const onError = (event: ErrorEvent) => {
      reportClientError({
        source: "client",
        name: event.error instanceof Error ? event.error.name : "WindowError",
        message:
          event.error instanceof Error
            ? event.error.message
            : event.message || "Unknown browser error",
        stack: event.error instanceof Error ? event.error.stack : undefined,
        path: currentPath(),
        userAgent: navigator.userAgent,
        metadata: {
          filename: event.filename || undefined,
          line: event.lineno || undefined,
          column: event.colno || undefined,
        },
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const details = errorFromReason(event.reason);

      reportClientError({
        source: "client",
        ...details,
        path: currentPath(),
        userAgent: navigator.userAgent,
        metadata: {
          type: "unhandledrejection",
        },
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
