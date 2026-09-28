import "server-only";

export const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

type JsonRequestGuard =
  | { ok: true }
  | { ok: false; status: 413 | 415; error: string };

export function validateJsonRequest(
  request: Request,
  maxBytes = 16_384,
): JsonRequestGuard {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return {
      ok: false,
      status: 415,
      error: "Unsupported request format.",
    };
  }

  const rawLength = request.headers.get("content-length");
  if (rawLength) {
    const contentLength = Number(rawLength);
    if (!Number.isFinite(contentLength) || contentLength < 0) {
      return {
        ok: false,
        status: 413,
        error: "The request is too large.",
      };
    }
    if (contentLength > maxBytes) {
      return {
        ok: false,
        status: 413,
        error: "The request is too large.",
      };
    }
  }

  return { ok: true };
}
