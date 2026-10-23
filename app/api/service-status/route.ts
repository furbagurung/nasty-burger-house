import { readShopStatus } from "../../lib/shop-status";

export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(await readShopStatus(), { headers: { "Cache-Control": "no-store" } });
}
