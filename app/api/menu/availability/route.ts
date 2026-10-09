import { readMenuAvailability } from "@/app/lib/menu-availability";

export async function GET() {
  const status = await readMenuAvailability();
  return Response.json(
    { ok: status.ok || status.reason === "setup-required", soldOutIds: status.soldOutIds },
    { status: status.reason === "unavailable" ? 503 : 200,
      headers: { "Cache-Control": "no-store" } },
  );
}
