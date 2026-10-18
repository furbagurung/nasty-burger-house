import "server-only";

import { withSquare429Retry } from "./retry";

const DEFAULT_SQUARE_API_VERSION = "2026-08-19";

export type SquareEnvironment = "sandbox" | "production";

type SquareError = {
  category?: string;
  code?: string;
  detail?: string;
  field?: string;
};

export class SquareApiError extends Error {
  status: number;
  errors: SquareError[];
  endpoint?: string;
  requestId?: string;
  retryAfterMs?: number;

  constructor(
    status: number,
    errors: SquareError[],
    fallbackMessage: string,
    details: { endpoint?: string; requestId?: string; retryAfterMs?: number } = {},
  ) {
    super(errors[0]?.detail || fallbackMessage);
    this.name = "SquareApiError";
    this.status = status;
    this.errors = errors;
    this.endpoint = details.endpoint;
    this.requestId = details.requestId;
    this.retryAfterMs = details.retryAfterMs;
  }
}

export function getSquareConfig() {
  const environment: SquareEnvironment =
    process.env.SQUARE_ENVIRONMENT?.trim().toLowerCase() === "production"
      ? "production"
      : "sandbox";
  const accessToken = process.env.SQUARE_ACCESS_TOKEN?.trim() || "";
  const locationId = process.env.SQUARE_LOCATION_ID?.trim() || "";
  const apiVersion =
    process.env.SQUARE_API_VERSION?.trim() || DEFAULT_SQUARE_API_VERSION;

  return {
    environment,
    accessToken,
    locationId,
    apiVersion,
    baseUrl:
      environment === "production"
        ? "https://connect.squareup.com"
        : "https://connect.squareupsandbox.com",
  };
}

export function squareConfigurationState() {
  const config = getSquareConfig();
  const missing = [
    config.accessToken ? null : "SQUARE_ACCESS_TOKEN",
    config.locationId ? null : "SQUARE_LOCATION_ID",
  ].filter((value): value is string => Boolean(value));

  return {
    configured: missing.length === 0,
    missing,
    environment: config.environment,
    apiVersion: config.apiVersion,
  };
}

function retryAfterMs(headers: Headers): number | undefined {
  const value = headers.get("retry-after");
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : undefined;
}

function canSafelyRetry(path: string, init: RequestInit): boolean {
  const method = (init.method ?? "GET").toUpperCase();
  if (["GET", "HEAD", "PUT", "DELETE"].includes(method)) return true;
  if (method !== "POST") return false;

  // Square search endpoints use POST for reads, without idempotency keys.
  if (path.split("?")[0].endsWith("/search")) return true;
  if (typeof init.body !== "string") return false;
  try {
    const body = JSON.parse(init.body) as { idempotency_key?: unknown };
    return typeof body.idempotency_key === "string" && body.idempotency_key.length > 0;
  } catch {
    return false;
  }
}

export async function squareRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = getSquareConfig();
  if (!config.accessToken) {
    throw new SquareApiError(
      503,
      [{ code: "SQUARE_NOT_CONFIGURED", detail: "Square access token is not configured." }],
      "Square is not configured.",
    );
  }

  const method = (init.method ?? "GET").toUpperCase();
  const endpoint = `${method} ${path.split("?")[0]}`;
  const safeToRetry = canSafelyRetry(path, init);
  return withSquare429Retry(async () => {
    // A fresh per-attempt timeout avoids reusing an expired timeout signal.
    const response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Square-Version": config.apiVersion,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(12_000),
    });

    const body = (await response.json().catch(() => ({}))) as {
      errors?: SquareError[];
    } & T;

    if (!response.ok) {
      throw new SquareApiError(
        response.status,
        Array.isArray(body.errors) ? body.errors : [],
        `Square request failed with status ${response.status}.`,
        {
          endpoint,
          requestId: response.headers.get("x-squared-request-id") ??
            response.headers.get("x-request-id") ?? undefined,
          retryAfterMs: retryAfterMs(response.headers),
        },
      );
    }
    return body as T;
  }, {
    maxRetries: safeToRetry ? 2 : 0,
    onRetry: ({ attempt, delayMs }) => {
      // No access tokens, customer data or Square request bodies in logs.
      console.warn("[NBH Square 429 retry]", { endpoint, attempt, delayMs });
    },
  });
}
