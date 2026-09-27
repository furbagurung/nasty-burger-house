import "server-only";

import { createHash } from "crypto";
import { getAdminClientOrNull } from "./supabase/admin";

type RateLimitOptions = {
  scope: string;
  key: string;
  limit: number;
  windowSeconds: number;
};

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; status: 429 | 503; retryAfter?: number };

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function requestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim();
  return ip || null;
}

export async function consumeRateLimit({
  scope,
  key,
  limit,
  windowSeconds,
}: RateLimitOptions): Promise<RateLimitResult> {
  const admin = getAdminClientOrNull();
  if (!admin) {
    console.error("[NBH rate limit] Supabase admin client is unavailable.");
    return { ok: false, status: 503 };
  }

  const { data, error } = await admin.rpc("consume_rate_limit", {
    limit_scope: scope,
    limit_key_hash: hashKey(key),
    max_attempts: limit,
    window_seconds: windowSeconds,
  });

  if (error) {
    console.error("[NBH rate limit]", error);
    return { ok: false, status: 503 };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row.allowed !== "boolean") {
    console.error("[NBH rate limit] Unexpected response.");
    return { ok: false, status: 503 };
  }

  if (!row.allowed) {
    return {
      ok: false,
      status: 429,
      retryAfter: Math.max(1, Number(row.retry_after_seconds || windowSeconds)),
    };
  }

  return {
    ok: true,
    remaining: Math.max(0, limit - Number(row.attempts || 0)),
  };
}

export async function enforceAuthRateLimit(
  request: Request,
  scope: string,
  identifier: string,
  limit = 5,
  windowSeconds = 600,
): Promise<RateLimitResult> {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const ip = requestIp(request);

  const keys = [
    `identifier:${normalizedIdentifier}`,
    ...(ip ? [`ip:${ip}`] : []),
  ];

  for (const key of keys) {
    const result = await consumeRateLimit({
      scope,
      key,
      limit,
      windowSeconds,
    });

    if (!result.ok) return result;
  }

  return { ok: true, remaining: 0 };
}
