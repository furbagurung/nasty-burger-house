import { getServiceStatus } from "../../lib/service";

export async function GET() {
  return Response.json(getServiceStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}
