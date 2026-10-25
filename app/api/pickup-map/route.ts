import { NextResponse } from "next/server";
import { resolveOwnerPickupEmbed } from "../../lib/google-maps-embed";

export async function GET() {
  const embedUrl = await resolveOwnerPickupEmbed();
  return NextResponse.json(
    { embedUrl },
    { headers: { "Cache-Control": "public, max-age=600" } },
  );
}
