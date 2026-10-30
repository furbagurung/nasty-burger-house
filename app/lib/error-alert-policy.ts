type ErrorAlertInput = {
  source: "client" | "react" | "server" | "checkout";
  name?: string;
  message: string;
  path?: string;
  userAgent?: string;
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

  // Brave on iOS can inject its wallet compatibility code into the document.
  // Its assignment to an absent window.ethereum object produces an onerror
  // event that names the document as its source, rather than an application JS file.
  const braveOnIphone = /\biPhone\b/.test(input.userAgent ?? "") && /\bBrave\b/.test(input.userAgent ?? "");
  if (!braveOnIphone) return;

  const walletInjectionMessage =
    input.message === "undefined is not an object (evaluating 'window.ethereum.selectedAddress = undefined')";
  const fromSiteDocument =
    typeof filename === "string" &&
    /^https:\/\/(?:www\.)?nastyburgerhouse\.com\.au(?:\/|$)/.test(filename);
  if (
    walletInjectionMessage &&
    fromSiteDocument &&
    input.metadata?.line === 1 &&
    input.metadata?.column === 16
  ) {
    return "brave-ios-wallet-instrumentation";
  }

  // The same Brave session can additionally emit opaque cross-origin window
  // errors (no filename, stack, or Error object). There is no useful app trace
  // to action; genuine React boundaries and other sources still report normally.
  if (
    input.name === "WindowError" &&
    input.message === "Script error." &&
    !input.stack &&
    (filename === undefined || filename === "") &&
    input.metadata?.line === undefined &&
    input.metadata?.column === undefined
  ) {
    return "brave-ios-opaque-script-error";
  }
}
