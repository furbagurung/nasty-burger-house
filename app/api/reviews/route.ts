import { consumeRateLimit, requestIp } from "../../lib/rate-limit";
import {
  NO_STORE_HEADERS,
  validateJsonRequest,
} from "../../lib/request-security";
import { getAdminClientOrNull } from "../../lib/supabase/admin";
import { getServerClientOrNull } from "../../lib/supabase/server";

type PublishedReviewRow = {
  id: string;
  customer_id: string;
  rating: number;
  message: string;
  created_at: string;
};

type CustomerNameRow = {
  id: string;
  name: string;
};

function publicDisplayName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Nasty customer";
  if (parts.length === 1) return parts[0];
  return parts[0] + " " + parts[parts.length - 1].charAt(0).toUpperCase() + ".";
}

function publicCacheHeaders() {
  return {
    "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
  };
}

export async function GET() {
  const admin = getAdminClientOrNull();
  if (!admin) {
    return Response.json(
      { ok: false, error: "Reviews are temporarily unavailable." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  const [reviewsResult, ratingsResult] = await Promise.all([
    admin
      .from("reviews")
      .select("id,customer_id,rating,message,created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(30),
    admin
      .from("reviews")
      .select("rating")
      .eq("status", "published"),
  ]);

  if (reviewsResult.error || ratingsResult.error) {
    console.error("[NBH public reviews read failed]", {
      reviews: reviewsResult.error?.code,
      ratings: ratingsResult.error?.code,
    });
    return Response.json(
      { ok: false, error: "Reviews are temporarily unavailable." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  const reviews = (reviewsResult.data ?? []) as PublishedReviewRow[];
  const customerIds = Array.from(new Set(reviews.map((review) => review.customer_id)));
  const names = new Map<string, string>();

  if (customerIds.length > 0) {
    const { data, error } = await admin
      .from("customers")
      .select("id,name")
      .in("id", customerIds);

    if (error) {
      console.error("[NBH public review names read failed]", error.code);
    } else {
      ((data ?? []) as CustomerNameRow[]).forEach((customer) => {
        names.set(customer.id, publicDisplayName(customer.name));
      });
    }
  }

  const ratings = (ratingsResult.data ?? [])
    .map((row) => Number(row.rating))
    .filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5);
  const average =
    ratings.length === 0
      ? 0
      : Math.round(
          (ratings.reduce((total, rating) => total + rating, 0) / ratings.length) *
            10,
        ) / 10;

  return Response.json(
    {
      ok: true,
      summary: {
        count: ratings.length,
        average,
      },
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        message: review.message,
        displayName: names.get(review.customer_id) ?? "Nasty customer",
        createdAt: review.created_at,
        verifiedPurchase: true,
      })),
    },
    { headers: publicCacheHeaders() },
  );
}

export async function POST(request: Request) {
  const requestGuard = validateJsonRequest(request, 12_288);
  if (!requestGuard.ok) {
    return Response.json(
      { ok: false, error: "We could not submit your review." },
      { status: requestGuard.status, headers: NO_STORE_HEADERS },
    );
  }

  const [supabase, admin] = await Promise.all([
    getServerClientOrNull(),
    Promise.resolve(getAdminClientOrNull()),
  ]);

  if (!supabase || !admin) {
    return Response.json(
      { ok: false, error: "Review submission is temporarily unavailable." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId =
    !claimsError && claims && typeof claims.sub === "string" ? claims.sub : "";

  if (!userId) {
    return Response.json(
      { ok: false, error: "Sign in to leave a review." },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  let body: {
    orderId?: unknown;
    rating?: unknown;
    message?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "We could not submit your review." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const rating = Number(body.rating);
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (
    orderId.length < 1 ||
    orderId.length > 120 ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    message.length > 1000
  ) {
    return Response.json(
      { ok: false, error: "Please choose a 1–5 star rating and try again." },
      { status: 422, headers: NO_STORE_HEADERS },
    );
  }

  const userRateLimit = await consumeRateLimit({
    scope: "customer-review-submit",
    key: "user:" + userId,
    limit: 8,
    windowSeconds: 3600,
  });

  if (!userRateLimit.ok) {
    return Response.json(
      {
        ok: false,
        error:
          userRateLimit.status === 429
            ? "Too many review updates. Please try again later."
            : "Review submission is temporarily unavailable.",
      },
      {
        status: userRateLimit.status,
        headers: userRateLimit.retryAfter
          ? {
              "Retry-After": String(userRateLimit.retryAfter),
              "Cache-Control": "no-store",
            }
          : NO_STORE_HEADERS,
      },
    );
  }

  const ip = requestIp(request);
  if (ip) {
    const ipRateLimit = await consumeRateLimit({
      scope: "customer-review-submit-ip",
      key: "ip:" + ip,
      limit: 20,
      windowSeconds: 3600,
    });

    if (!ipRateLimit.ok) {
      return Response.json(
        {
          ok: false,
          error:
            ipRateLimit.status === 429
              ? "Too many review updates. Please try again later."
              : "Review submission is temporarily unavailable.",
        },
        {
          status: ipRateLimit.status,
          headers: ipRateLimit.retryAfter
            ? {
                "Retry-After": String(ipRateLimit.retryAfter),
                "Cache-Control": "no-store",
              }
            : NO_STORE_HEADERS,
        },
      );
    }
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id,customer_id,status")
    .eq("id", orderId)
    .maybeSingle();

  if (
    orderError ||
    !order ||
    order.customer_id !== userId ||
    order.status !== "completed"
  ) {
    return Response.json(
      {
        ok: false,
        error: "Only a completed order from your account can be reviewed.",
      },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  const { data: review, error: reviewError } = await admin
    .from("reviews")
    .upsert(
      {
        customer_id: userId,
        order_id: orderId,
        rating,
        message,
        status: "pending",
      },
      { onConflict: "customer_id,order_id" },
    )
    .select("id,order_id,rating,message,status,created_at")
    .single();

  if (reviewError || !review) {
    console.error("[NBH review save failed]", reviewError?.code);
    return Response.json(
      { ok: false, error: "We could not submit your review." },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }

  return Response.json(
    {
      ok: true,
      review: {
        id: review.id,
        orderId: review.order_id,
        rating: review.rating,
        message: review.message,
        status: review.status,
        createdAt: review.created_at,
      },
      message: "Thanks — your review is pending approval.",
    },
    { headers: NO_STORE_HEADERS },
  );
}
