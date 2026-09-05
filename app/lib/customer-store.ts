import {
  DRIP_SIGNUP_BONUS,
  calculateEarnedDripPoints,
} from "./loyalty";

export const CUSTOMER_STORAGE_KEY = "nasty-burger-customer-v1";
export const CUSTOMER_SESSION_KEY = "nasty-burger-customer-session-v1";
export const ORDER_HISTORY_STORAGE_KEY = "nasty-burger-order-history-v1";
export const DRIP_LEDGER_STORAGE_KEY = "nasty-burger-drip-ledger-v1";
export const REVIEWS_STORAGE_KEY = "nasty-burger-reviews-v1";
export const LEGACY_LOYALTY_STORAGE_KEY = "nasty-burger-drip-signup";

export type CustomerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerOrderLine = {
  itemId: string;
  name: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  details: string[];
};

export type CustomerOrder = {
  orderId: string;
  submittedAt: string;
  status: "received" | "preparing" | "ready" | "completed" | "cancelled";
  subtotal: number;
  earnedDripPoints: number;
  adminNotification?: "sent" | "not-configured" | "failed";
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupLabel: string;
  lines: CustomerOrderLine[];
};

export type DripLedgerEntry = {
  id: string;
  type: "signup" | "order" | "redeem" | "adjustment";
  points: number;
  description: string;
  createdAt: string;
  orderId?: string;
};

export type CustomerReview = {
  id: string;
  orderId: string;
  rating: number;
  message: string;
  createdAt: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function safeParseArray<T>(key: string): T[] {
  if (!canUseStorage()) return [];
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function readCustomerProfile(): CustomerProfile | null {
  if (!canUseStorage()) return null;
  try {
    const value = window.localStorage.getItem(CUSTOMER_STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<CustomerProfile>;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.phone !== "string"
    ) {
      return null;
    }
    return parsed as CustomerProfile;
  } catch {
    return null;
  }
}

export function readSignedInCustomerProfile(): CustomerProfile | null {
  if (!canUseStorage()) return null;
  const profile = readCustomerProfile();
  if (!profile) return null;
  return window.localStorage.getItem(CUSTOMER_SESSION_KEY) === profile.id
    ? profile
    : null;
}

export function signInCustomerByEmail(email: string) {
  if (!canUseStorage()) return null;
  const profile = readCustomerProfile();
  if (!profile || profile.email !== email.trim().toLowerCase()) return null;
  window.localStorage.setItem(CUSTOMER_SESSION_KEY, profile.id);
  window.dispatchEvent(new Event("nasty-customer-updated"));
  return profile;
}

export function signOutCustomer() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
  window.dispatchEvent(new Event("nasty-customer-updated"));
}

export function saveCustomerProfile(
  input: Pick<CustomerProfile, "name" | "email" | "phone"> &
    Partial<Pick<CustomerProfile, "birthday">>,
) {
  if (!canUseStorage()) return null;
  const existing = readCustomerProfile();
  const now = new Date().toISOString();
  const profile: CustomerProfile = {
    id: existing?.id ?? makeId("customer"),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    birthday: input.birthday?.trim() || undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  window.localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(profile));
  window.localStorage.setItem(CUSTOMER_SESSION_KEY, profile.id);
  window.dispatchEvent(new Event("nasty-customer-updated"));
  return profile;
}

export function clearCustomerProfile() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(CUSTOMER_STORAGE_KEY);
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
  window.dispatchEvent(new Event("nasty-customer-updated"));
}

export function readCustomerOrders() {
  return safeParseArray<CustomerOrder>(ORDER_HISTORY_STORAGE_KEY);
}

export function saveCustomerOrder(order: CustomerOrder) {
  if (!canUseStorage()) return;
  const current = readCustomerOrders().filter(
    (entry) => entry.orderId !== order.orderId,
  );
  window.localStorage.setItem(
    ORDER_HISTORY_STORAGE_KEY,
    JSON.stringify([order, ...current].slice(0, 100)),
  );
  window.dispatchEvent(new Event("nasty-orders-updated"));
}

export function updateCustomerOrderStatus(
  orderId: string,
  status: CustomerOrder["status"],
) {
  if (!canUseStorage()) return;
  const orders = readCustomerOrders();
  window.localStorage.setItem(
    ORDER_HISTORY_STORAGE_KEY,
    JSON.stringify(
      orders.map((order) =>
        order.orderId === orderId ? { ...order, status } : order,
      ),
    ),
  );
  window.dispatchEvent(new Event("nasty-orders-updated"));
}

export function readDripLedger() {
  return safeParseArray<DripLedgerEntry>(DRIP_LEDGER_STORAGE_KEY);
}

export function dripBalance(entries = readDripLedger()) {
  return entries.reduce((total, entry) => total + Number(entry.points || 0), 0);
}

export function ensureSignupBonus() {
  if (!canUseStorage()) return 0;
  const ledger = readDripLedger();
  if (ledger.some((entry) => entry.type === "signup")) {
    window.localStorage.setItem(LEGACY_LOYALTY_STORAGE_KEY, "complete");
    return 0;
  }

  const entry: DripLedgerEntry = {
    id: makeId("drip"),
    type: "signup",
    points: DRIP_SIGNUP_BONUS,
    description: "Welcome to Drip Points",
    createdAt: new Date().toISOString(),
  };
  window.localStorage.setItem(
    DRIP_LEDGER_STORAGE_KEY,
    JSON.stringify([entry, ...ledger]),
  );
  window.localStorage.setItem(LEGACY_LOYALTY_STORAGE_KEY, "complete");
  window.dispatchEvent(new Event("nasty-drip-updated"));
  return DRIP_SIGNUP_BONUS;
}

export function awardOrderDripPoints(orderId: string, subtotal: number) {
  if (!canUseStorage()) return 0;
  const ledger = readDripLedger();
  const existing = ledger.find(
    (entry) => entry.type === "order" && entry.orderId === orderId,
  );
  if (existing) return existing.points;

  const points = calculateEarnedDripPoints(subtotal);
  if (points <= 0) return 0;
  const entry: DripLedgerEntry = {
    id: makeId("drip"),
    type: "order",
    points,
    description: `Earned from order ${orderId}`,
    orderId,
    createdAt: new Date().toISOString(),
  };
  window.localStorage.setItem(
    DRIP_LEDGER_STORAGE_KEY,
    JSON.stringify([entry, ...ledger]),
  );
  window.dispatchEvent(new Event("nasty-drip-updated"));
  return points;
}

export function readCustomerReviews() {
  return safeParseArray<CustomerReview>(REVIEWS_STORAGE_KEY);
}

export function saveCustomerReview(input: {
  orderId: string;
  rating: number;
  message: string;
}) {
  if (!canUseStorage()) return null;
  const reviews = readCustomerReviews();
  const review: CustomerReview = {
    id:
      reviews.find((entry) => entry.orderId === input.orderId)?.id ??
      makeId("review"),
    orderId: input.orderId,
    rating: Math.max(1, Math.min(5, Math.round(input.rating))),
    message: input.message.trim().slice(0, 1000),
    createdAt: new Date().toISOString(),
  };
  window.localStorage.setItem(
    REVIEWS_STORAGE_KEY,
    JSON.stringify([
      review,
      ...reviews.filter((entry) => entry.orderId !== input.orderId),
    ]),
  );
  window.dispatchEvent(new Event("nasty-reviews-updated"));
  return review;
}
