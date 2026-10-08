import { reportAdminError } from "../../lib/error-monitoring";
import { consumeRateLimit, requestIp } from "../../lib/rate-limit";

const MAX_REQUEST_BYTES = 20_000;

type ClientErrorBody = {
  source?: unknown;
  name?: unknown;
  message?: unknown;
  stack?: unknown;
  digest?: unknown;
  path?: unknown;
  userAgent?: unknown;
  metadata?: unknown;
};

function textValue(value: unknown, maximum: number) {
  return typeof value === "string" ? value.slice(0, maximum) : undefined;
}

function allowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!allowedOrigin(request)) {
    return new Response(null, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return new Response(null, { status: 413 });
  }

  const ip = requestIp(request);
  if (ip) {
    const rateLimit = await consumeRateLimit({
      scope: "client-error-report",
      key: `ip:${ip}`,
      limit: 15,
      windowSeconds: 600,
    });

    if (!rateLimit.ok && rateLimit.status === 429) {
      return new Response(null, { status: 204 });
    }
  }

  let body: ClientErrorBody;
  try {
    body = (await request.json()) as ClientErrorBody;
  } catch {
    return new Response(null, { status: 400 });
  }

  const source = body.source === "react" ? "react" : "client";
  const message = textValue(body.message, 2_000);
  if (!message) {
    return new Response(null, { status: 400 });
  }

  const name = textValue(body.name, 120) || "ClientError";
  const stack = textValue(body.stack, 12_000);
  const digest = textValue(body.digest, 200);
  const path = textValue(body.path, 500);
  const userAgent =
    textValue(body.userAgent, 500) ||
    textValue(request.headers.get("user-agent"), 500);

  const metadata =
    body.metadata &&
    typeof body.metadata === "object" &&
    !Array.isArray(body.metadata)
      ? (body.metadata as Record<string, unknown>)
      : undefined;

  const error = new Error(message);
  error.name = name;
  if (stack) error.stack = stack;

  await reportAdminError(error, {
    source,
    path,
    method: "CLIENT",
    digest,
    userAgent,
    metadata,
  });

  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
