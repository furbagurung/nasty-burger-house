import { getSquareConfig, squareConfigurationState, squareRequest } from "../../../lib/square/api";

type LocationResponse = {
  location?: {
    id?: string;
    name?: string;
    status?: string;
    business_name?: string;
    currency?: string;
    country?: string;
  };
};

export async function GET() {
  const state = squareConfigurationState();
  if (!state.configured) {
    return Response.json(state, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const config = getSquareConfig();
  try {
    const result = await squareRequest<LocationResponse>(
      `/v2/locations/${encodeURIComponent(config.locationId)}`,
      { method: "GET" },
    );

    return Response.json(
      {
        ...state,
        connected: true,
        location: result.location
          ? {
              id: result.location.id ?? config.locationId,
              name: result.location.name ?? null,
              businessName: result.location.business_name ?? null,
              status: result.location.status ?? null,
              currency: result.location.currency ?? null,
              country: result.location.country ?? null,
            }
          : null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[NBH Square status check failed]", error);
    return Response.json(
      {
        ...state,
        connected: false,
        error: error instanceof Error ? error.message : "Square connection failed.",
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
