import "server-only";

type ErrorSource = "server" | "client" | "react" | "checkout";

export type AdminErrorContext = {
  source: ErrorSource;
  path?: string;
  method?: string;
  routePath?: string;
  routeType?: string;
  digest?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

type ErrorEmailResult =
  | { ok: true }
  | {
      ok: false;
      reason: "not-configured" | "not-production" | "delivery-failed";
    };

const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function truncate(value: string, maximum: number) {
  return value.length > maximum ? `${value.slice(0, maximum)}…` : value;
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function errorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: truncate(error.name || "Error", 120),
      message: truncate(error.message || "Unknown error", 2_000),
      stack: truncate(error.stack ?? "", 12_000),
    };
  }

  if (typeof error === "string") {
    return {
      name: "Error",
      message: truncate(error, 2_000),
      stack: "",
    };
  }

  try {
    return {
      name: "Error",
      message: truncate(JSON.stringify(error), 2_000),
      stack: "",
    };
  } catch {
    return {
      name: "Error",
      message: "Unknown non-serializable error",
      stack: "",
    };
  }
}

function productionRuntime() {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === "production";
  return process.env.NODE_ENV === "production";
}

function sydneyTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    dateStyle: "medium",
    timeStyle: "long",
  }).format(date);
}

function safeMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) return "";

  try {
    return truncate(JSON.stringify(metadata, null, 2), 6_000);
  } catch {
    return "[metadata could not be serialized]";
  }
}

export async function reportAdminError(
  error: unknown,
  context: AdminErrorContext,
): Promise<ErrorEmailResult> {
  if (!productionRuntime()) {
    return { ok: false, reason: "not-production" };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to =
    process.env.ERROR_NOTIFICATION_EMAIL?.trim() ||
    process.env.ORDER_NOTIFICATION_EMAIL?.trim();
  const from =
    process.env.ERROR_NOTIFICATION_FROM?.trim() ||
    process.env.ORDER_NOTIFICATION_FROM?.trim();

  if (!apiKey || !to || !from) {
    return { ok: false, reason: "not-configured" };
  }

  const details = errorDetails(error);
  const cleanPath = truncate(context.path ?? "", 500);
  const routePath = truncate(context.routePath ?? "", 500);
  const method = truncate(context.method ?? "", 20);
  const userAgent = truncate(context.userAgent ?? "", 500);
  const metadata = safeMetadata(context.metadata);

  const fingerprintSource = [
    context.source,
    details.name,
    details.message,
    routePath,
    cleanPath,
    method,
  ].join("|");
  const fingerprint = stableHash(fingerprintSource);
  const bucket = Math.floor(Date.now() / DEDUPE_WINDOW_MS);
  const bucketStart = new Date(bucket * DEDUPE_WINDOW_MS);
  const idempotencyKey = `nbh-error-${fingerprint}-${bucket}`;
  const location = routePath || cleanPath || "unknown route";
  const subject = `[NBH ERROR] ${context.source.toUpperCase()} · ${truncate(location, 90)}`;

  const rows = [
    ["Source", context.source],
    ["Route", routePath || "—"],
    ["Path", cleanPath || "—"],
    ["Method", method || "—"],
    ["Digest", context.digest || "—"],
    ["Time", `${sydneyTimestamp(bucketStart)} (Sydney)`],
    ["Fingerprint", fingerprint],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:7px 12px 7px 0;color:#746d65;font-size:13px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:7px 0;font-size:13px;font-weight:700;word-break:break-word">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f4f2ee;font-family:Arial,sans-serif;color:#171513">
    <div style="max-width:760px;margin:0 auto;padding:32px 18px">
      <div style="background:#11100f;color:#fff;border-radius:20px 20px 0 0;padding:24px 28px">
        <div style="color:#ff5938;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">Nasty Burger House · Production monitoring</div>
        <h1 style="margin:8px 0 0;font-size:30px;line-height:1.1">Live website error detected</h1>
      </div>
      <div style="background:#fff;border-radius:0 0 20px 20px;padding:28px">
        <h2 style="margin:0 0 8px;font-size:20px">${escapeHtml(details.name)}</h2>
        <p style="margin:0 0 20px;color:#b42318;font-size:15px;font-weight:700;line-height:1.5">${escapeHtml(details.message)}</p>
        <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:20px">${rows}</table>
        ${userAgent ? `<div style="margin:0 0 18px"><strong style="font-size:13px">Browser / client</strong><pre style="white-space:pre-wrap;word-break:break-word;background:#f7f5f1;border-radius:10px;padding:12px;font-size:12px">${escapeHtml(userAgent)}</pre></div>` : ""}
        ${metadata ? `<div style="margin:0 0 18px"><strong style="font-size:13px">Context</strong><pre style="white-space:pre-wrap;word-break:break-word;background:#f7f5f1;border-radius:10px;padding:12px;font-size:12px">${escapeHtml(metadata)}</pre></div>` : ""}
        ${details.stack ? `<div><strong style="font-size:13px">Stack trace</strong><pre style="white-space:pre-wrap;word-break:break-word;background:#11100f;color:#f7f3ee;border-radius:10px;padding:14px;font-size:11px;line-height:1.5;overflow:auto">${escapeHtml(details.stack)}</pre></div>` : ""}
        <p style="margin:20px 0 0;color:#77716a;font-size:12px;line-height:1.5">Identical errors are deduplicated into 10-minute windows to avoid email floods.</p>
      </div>
    </div>
  </body>
</html>`;

  const text = [
    "Nasty Burger House production error",
    `${details.name}: ${details.message}`,
    `Source: ${context.source}`,
    `Route: ${routePath || "—"}`,
    `Path: ${cleanPath || "—"}`,
    `Method: ${method || "—"}`,
    `Digest: ${context.digest || "—"}`,
    `Time: ${sydneyTimestamp(bucketStart)} (Sydney)`,
    `Fingerprint: ${fingerprint}`,
    userAgent ? `Browser / client: ${userAgent}` : "",
    metadata ? `Context:\n${metadata}` : "",
    details.stack ? `Stack trace:\n${details.stack}` : "",
    "",
    "Identical errors are deduplicated into 10-minute windows.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok && response.status !== 409) {
      console.error(
        "[NBH error notification failed]",
        response.status,
        await response.text(),
      );
      return { ok: false, reason: "delivery-failed" };
    }

    return { ok: true };
  } catch (notificationError) {
    console.error("[NBH error notification failed]", notificationError);
    return { ok: false, reason: "delivery-failed" };
  }
}
