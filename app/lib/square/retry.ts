/** Small retry budget for idempotent Square operations. Never retry arbitrary writes. */
export type SquareRetryError = { status: number; retryAfterMs?: number };

export function isSquareRateLimited(error: unknown): error is SquareRetryError {
  return error instanceof Error && 'status' in error && error.status === 429;
}

type Options = {
  maxRetries?: number;
  onRetry?: (info: { attempt: number; delayMs: number }) => void;
  sleep?: (delayMs: number) => Promise<void>;
  random?: () => number;
};

export async function withSquare429Retry<T>(
  request: () => Promise<T>,
  { maxRetries = 2, onRetry, sleep = (ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)), random = Math.random }: Options = {},
): Promise<T> {
  if (!Number.isInteger(maxRetries) || maxRetries < 0 || maxRetries > 2) {
    throw new Error('Square retries must be between zero and two');
  }
  let waitedMs = 0;
  for (let attempt = 0; ; attempt++) {
    try {
      return await request();
    } catch (error) {
      if (!isSquareRateLimited(error) || attempt >= maxRetries) throw error;
      const baseMs = Math.min(3_000, 500 * 2 ** attempt);
      const jitterMs = Math.floor(baseMs * 0.25 * Math.min(1, Math.max(0, random())));
      const retryAfterMs = typeof error.retryAfterMs === 'number' && Number.isFinite(error.retryAfterMs)
        ? Math.max(0, error.retryAfterMs) : 0;
      const delayMs = Math.max(baseMs + jitterMs, retryAfterMs);
      if (waitedMs + delayMs > 8_000) throw error;
      waitedMs += delayMs;
      onRetry?.({ attempt: attempt + 1, delayMs });
      await sleep(delayMs);
    }
  }
}
