import { getSquareConfig } from "../../../lib/square/api";
import { listOnlineSquareRewardTiers } from "../../../lib/square/rewards";
import { verifiedSquareRewardMember } from "../../../lib/square/reward-identity";

export async function GET() {
  const enabled = process.env.SQUARE_ONLINE_REDEMPTION_ENABLED === "true";
  const smsReady = process.env.SUPABASE_SMS_VERIFICATION_ENABLED === "true";

  // Redemption is not launched in production. Do not request SMS verification
  // or connect to Square while the redemption feature is intentionally off.
  if (!enabled) {
    return Response.json({
      ok: true,
      enabled: false,
      authenticated: null,
      needsPhoneVerification: false,
      balance: null,
      tiers: [],
      reason: "Online rewards are coming soon. You can still earn Drip Points and redeem rewards in-store.",
    }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const member = await verifiedSquareRewardMember();
    if (!member.ok) {
      return Response.json({
        ok: true,
        enabled: false,
        authenticated: member.authenticated,
        needsPhoneVerification: Boolean(member.needsPhoneVerification && smsReady),
        reason: member.needsPhoneVerification && !smsReady
          ? "Mobile verification is not available yet. You can still pay normally and redeem rewards in-store."
          : member.reason,
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
