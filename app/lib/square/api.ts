import "server-only";

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

  constructor(status: number, errors: SquareError[], fallbackMessage: string) {
    super(errors[0]?.detail || fallbackMessage);
    this.name = "SquareApiError";
    this.status = status;
    this.errors = errors;
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
    );
  }

  return body as T;
}
