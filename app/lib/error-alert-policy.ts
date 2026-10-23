type ErrorAlertInput = {
  source: "client" | "react" | "server" | "checkout";
  message: string;
  stack?: string;
  metadata?: Record<string, unknown>;
};

// Fail open: only known, narrowly identified browser noise skips email.
// Never suppress React error boundaries, server failures, or checkout errors.
export function browserNoiseReason(input: ErrorAlertInput): string | undefined {
  if (input.source !== "client") return;

  if (/^ResizeObserver loop (?:limit exceeded|completed with undelivered notifications\.?)$/.test(input.message)) {
    return "resize-observer-notification";
  }

  const filename = input.metadata?.filename;
  const instagramLogger = "iabjs://navigation_performance_logger_android";
  const fromInstagramLogger =
    (typeof filename === "string" && filename === instagramLogger) ||
    (input.stack ?? "").split("\n").some((line) =>
      /^\s*at\s/.test(line) && line.includes(`${instagramLogger}:`),
    );

  if (input.message === "Error invoking postMessage: Java object is gone" && fromInstagramLogger) {
    return "instagram-navigation-instrumentation";
  }
}
