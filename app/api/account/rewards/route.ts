import { getSquareConfig } from "../../../lib/square/api";
import { listOnlineSquareRewardTiers } from "../../../lib/square/rewards";
import { verifiedSquareRewardMember } from "../../../lib/square/reward-identity";

export async function GET() {
  const enabled = process.env.SQUARE_ONLINE_REDEMPTION_ENABLED === "true";
  try {
    const member = await verifiedSquareRewardMember();
    if (!member.ok) {
      return Response.json({
        ok: true,
        enabled: false,
        authenticated: member.authenticated,
        needsPhoneVerification: member.needsPhoneVerification ?? false,
        reason: member.reason,
        balance: null,
        tiers: [],
      }, { headers: { "Cache-Control": "no-store" } });
    }
    const tiers = await listOnlineSquareRewardTiers();
    return Response.json({
      ok: true,
      enabled: enabled && tiers.length > 0,
      sandbox: getSquareConfig().environment === "sandbox",
      balance: member.balance,
      tiers: tiers.map((tier) => ({ ...tier, eligible: member.balance >= tier.points })),
      reason: !enabled
        ? "Online redemption is being tested. You can still redeem in-store."
        : tiers.length === 0
          ? "No eligible online reward tier is configured in Square."
          : null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({
      ok: false, enabled: false, balance: null, tiers: [],
      reason: "Square rewards are temporarily unavailable. You can still check out without a reward.",
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
