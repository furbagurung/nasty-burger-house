export const DRIP_SIGNUP_BONUS = 500;
export const DRIP_POINTS_PER_AUD = 10;
export const DRIP_REWARD_TARGET = 2000;

export function calculateEarnedDripPoints(subtotal: number) {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  return Math.floor(subtotal * DRIP_POINTS_PER_AUD);
}

export function dripProgressPercent(balance: number) {
  if (!Number.isFinite(balance) || balance <= 0) return 0;
  return Math.min(100, Math.round((balance / DRIP_REWARD_TARGET) * 100));
}
