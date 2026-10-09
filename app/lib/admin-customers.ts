import "server-only";

import type { User } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { squareRequest } from "./square/api";
import { getAdminClientOrNull } from "./supabase/admin";

type AdminClient = NonNullable<ReturnType<typeof getAdminClientOrNull>>;

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday: string | null;
  created_at: string;
  updated_at: string;
};

type OrderRow = {
  customer_id: string | null;
  status: string;
  submitted_at: string;
};

type LedgerRow = {
  customer_id: string;
  points: number;
  points_status: string;
};

type AdminUserRow = {
  user_id: string;
};

type SquareLoyaltyAccount = {
  id?: string;
  customer_id?: string;
  balance?: number;
  lifetime_points?: number;
  created_at?: string;
  updated_at?: string;
  enrolled_at?: string;
  mapping?: {
    phone_number?: string;
  };
};

type SquareLoyaltySearchResponse = {
  loyalty_accounts?: SquareLoyaltyAccount[];
  cursor?: string;
};

type SquareCustomer = {
  id?: string;
  given_name?: string;
  family_name?: string;
  company_name?: string;
  email_address?: string;
  phone_number?: string;
  birthday?: string;
  created_at?: string;
  updated_at?: string;
};

type SquareDirectorySearchResponse = {
  customers?: SquareCustomer[];
  cursor?: string;
};

type SquareBulkRetrieveResponse = {
  responses?: Record<
    string,
    {
      customer?: SquareCustomer;
      errors?: Array<{ detail?: string }>;
    }
  >;
};

export type AdminCustomerSource = "website" | "square" | "both";

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday: string | null;
  source: AdminCustomerSource;
  websiteAccount: boolean;
  squareEnrolled: boolean;
  createdAt: string;
  updatedAt: string;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
  orderCount: number;
  lastOrderAt: string | null;
  websiteDripPoints: number;
  squareDripPoints: number | null;
  squareLifetimePoints: number | null;
  squareCustomerId: string | null;
  squareLoyaltyAccountId: string | null;
  squareEnrolledAt: string | null;
};

export type AdminCustomerPortalData = {
  customers: AdminCustomer[];
  square: {
    connected: boolean;
    loyaltyCount: number;
    directoryCount: number | null;
    directoryError: string | null;
    error: string | null;
  };
};

type WebsiteCustomer = Omit<
  AdminCustomer,
  | "source"
  | "squareEnrolled"
  | "squareDripPoints"
  | "squareLifetimePoints"
  | "squareCustomerId"
  | "squareLoyaltyAccountId"
  | "squareEnrolledAt"
>;

export type SquareEnrolledCustomer = {
  loyaltyAccountId: string | null;
  squareCustomerId: string;
  name: string;
  email: string;
  phone: string;
  birthday: string | null;
  createdAt: string;
  updatedAt: string;
  enrolledAt: string | null;
  balance: number | null;
  lifetimePoints: number | null;
};

function metadataString(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function normaliseEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function normalisePhone(value: string | null | undefined) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (/^04\d{8}$/.test(digits)) return `61${digits.slice(1)}`;
  if (/^614\d{8}$/.test(digits)) return digits;
  return digits;
}

function squareCustomerName(customer: SquareCustomer | undefined) {
  if (!customer) return "Square customer";
  const personName = [customer.given_name, customer.family_name]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
  return personName || customer.company_name?.trim() || "Square customer";
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function loadSquareLoyaltyAccounts() {
  const accounts: SquareLoyaltyAccount[] = [];
  let cursor: string | undefined;
  let pages = 0;

  do {
    const result = await squareRequest<SquareLoyaltySearchResponse>(
      "/v2/loyalty/accounts/search",
      {
        method: "POST",
        body: JSON.stringify({
          query: {},
          limit: 200,
          ...(cursor ? { cursor } : {}),
        }),
      },
    );

    accounts.push(...(result.loyalty_accounts ?? []));
    cursor = result.cursor || undefined;
    pages += 1;
  } while (cursor && pages < 50);

  return accounts;
}

async function loadSquareCustomerProfiles(customerIds: string[]) {
  const customers = new Map<string, SquareCustomer>();
  const uniqueIds = [...new Set(customerIds.filter(Boolean))];

  for (const group of chunks(uniqueIds, 100)) {
    const result = await squareRequest<SquareBulkRetrieveResponse>(
      "/v2/customers/bulk-retrieve",
      {
        method: "POST",
        body: JSON.stringify({ customer_ids: group }),
      },
    );

    for (const [customerId, response] of Object.entries(result.responses ?? {})) {
      if (response.customer) customers.set(customerId, response.customer);
    }
  }

  return customers;
}

async function loadSquareDirectoryCustomers(): Promise<SquareEnrolledCustomer[]> {
  const customers: SquareCustomer[] = [];
  let cursor: string | undefined;
  let pages = 0;

  do {
    const result = await squareRequest<SquareDirectorySearchResponse>(
      "/v2/customers/search",
      {
        method: "POST",
        body: JSON.stringify({ limit: 100, ...(cursor ? { cursor } : {}) }),
      },
    );

    customers.push(...(result.customers ?? []));
    cursor = result.cursor || undefined;
    pages += 1;
  } while (cursor && pages < 50);

  return customers.flatMap((customer) => {
    if (!customer.id) return [];
    const createdAt = customer.created_at || new Date(0).toISOString();
    return [{
      loyaltyAccountId: null,
      squareCustomerId: customer.id,
      name: squareCustomerName(customer),
      email: customer.email_address?.trim() ?? "",
      phone: customer.phone_number?.trim() ?? "",
      birthday: customer.birthday?.trim() || null,
      createdAt,
      updatedAt: customer.updated_at || createdAt,
      enrolledAt: null,
      balance: null,
      lifetimePoints: null,
    } satisfies SquareEnrolledCustomer];
  });
}
async function loadSquareEnrolledCustomers(preserveMissingBalances = false): Promise<SquareEnrolledCustomer[]> {
  const loyaltyAccounts = await loadSquareLoyaltyAccounts();
  const customerIds = loyaltyAccounts
    .map((account) => account.customer_id?.trim() ?? "")
    .filter(Boolean);
  const profiles = await loadSquareCustomerProfiles(customerIds);

  return loyaltyAccounts.flatMap((account) => {
    const squareCustomerId = account.customer_id?.trim() ?? "";
    const loyaltyAccountId = account.id?.trim() ?? "";
    if (!squareCustomerId || !loyaltyAccountId) return [];

    const customer = profiles.get(squareCustomerId);
    const phone =
      customer?.phone_number?.trim() || account.mapping?.phone_number?.trim() || "";
    const createdAt =
      account.created_at || customer?.created_at || account.enrolled_at || new Date(0).toISOString();
    const updatedAt = account.updated_at || customer?.updated_at || createdAt;
    const balance =
      typeof account.balance === "number" && Number.isFinite(account.balance)
        ? account.balance
        : preserveMissingBalances ? null : 0;
    const lifetimePoints =
      typeof account.lifetime_points === "number" &&
      Number.isFinite(account.lifetime_points)
        ? account.lifetime_points
        : preserveMissingBalances ? null : 0;

    return [
      {
        loyaltyAccountId,
        squareCustomerId,
        name: squareCustomerName(customer),
        email: customer?.email_address?.trim() ?? "",
        phone,
        birthday: customer?.birthday?.trim() || null,
        createdAt,
        updatedAt,
        enrolledAt: account.enrolled_at ?? null,
        balance,
        lifetimePoints,
      } satisfies SquareEnrolledCustomer,
    ];
  });
}


type SquareCustomerSnapshot = {
  customers: SquareEnrolledCustomer[];
  status: AdminCustomerPortalData["square"];
};

async function loadSquareCustomerSnapshot(): Promise<SquareCustomerSnapshot> {
  const squareCustomers = await loadSquareEnrolledCustomers();

  // Directory customers may have POS profiles but no Square Loyalty account.
  // Read only: never create accounts or adjust loyalty points in this view.
  let directoryCustomers: SquareEnrolledCustomer[] = [];
  let directoryCount: number | null = null;
  let directoryError: string | null = null;

  try {
    directoryCustomers = await loadSquareDirectoryCustomers();
    directoryCount = directoryCustomers.length;
  } catch (error) {
    console.error("[NBH admin Square directory fetch failed]", error);
    directoryError =
      "Square directory could not be loaded; loyalty accounts are still shown.";
  }

  const loyaltyIds = new Set(
    squareCustomers.map((customer) => customer.squareCustomerId),
  );
  const directoryOnly = directoryCustomers.filter(
    (customer) => !loyaltyIds.has(customer.squareCustomerId),
  );

  return {
    customers: [...squareCustomers, ...directoryOnly],
    status: {
      connected: true,
      loyaltyCount: squareCustomers.length,
      directoryCount,
      directoryError,
      error: null,
    },
  };
}

async function loadWebsiteCustomers(admin: AdminClient): Promise<WebsiteCustomer[]> {
  const [usersResult, customersResult, ordersResult, ledgerResult, adminsResult] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin
        .from("customers")
        .select("id,name,email,phone,birthday,created_at,updated_at"),
      admin
        .from("orders")
        .select("customer_id,status,submitted_at")
        .not("customer_id", "is", null),
      admin.from("drip_ledger").select("customer_id,points,points_status"),
      admin.from("admin_users").select("user_id"),
    ]);

  if (usersResult.error) throw usersResult.error;
  if (customersResult.error) throw customersResult.error;
  if (ordersResult.error) throw ordersResult.error;
  if (ledgerResult.error) throw ledgerResult.error;
  if (adminsResult.error) throw adminsResult.error;

  const customerRows = (customersResult.data ?? []) as CustomerRow[];
  const orderRows = (ordersResult.data ?? []) as OrderRow[];
  const ledgerRows = (ledgerResult.data ?? []) as LedgerRow[];
  const adminRows = (adminsResult.data ?? []) as AdminUserRow[];

  const profiles = new Map(customerRows.map((row) => [row.id, row]));
  const adminIds = new Set(adminRows.map((row) => row.user_id));

  const ordersByCustomer = new Map<string, OrderRow[]>();
  for (const order of orderRows) {
    if (!order.customer_id) continue;
    const current = ordersByCustomer.get(order.customer_id) ?? [];
    current.push(order);
    ordersByCustomer.set(order.customer_id, current);
  }

  const pointsByCustomer = new Map<string, number>();
  for (const entry of ledgerRows) {
    if (entry.points_status === "void") continue;
    pointsByCustomer.set(
      entry.customer_id,
      (pointsByCustomer.get(entry.customer_id) ?? 0) + entry.points,
    );
  }

  return usersResult.data.users
    .filter((user) => !adminIds.has(user.id))
    .map((user) => {
      const profile = profiles.get(user.id);
      const orders = ordersByCustomer.get(user.id) ?? [];
      const latestOrder =
        orders
          .map((order) => order.submitted_at)
          .filter(Boolean)
          .sort((a, b) => b.localeCompare(a))[0] ?? null;

      return {
        id: user.id,
        name: profile?.name || metadataString(user, "name") || "Customer",
        email: profile?.email || user.email || "",
        phone: profile?.phone || metadataString(user, "phone") || "",
        birthday: profile?.birthday ?? null,
        websiteAccount: true,
        createdAt: user.created_at,
        updatedAt: profile?.updated_at || user.updated_at || user.created_at,
        emailConfirmedAt: user.email_confirmed_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
        orderCount: orders.length,
        lastOrderAt: latestOrder,
        websiteDripPoints: pointsByCustomer.get(user.id) ?? 0,
      } satisfies WebsiteCustomer;
    });
}

const loadCachedWebsiteCustomers = unstable_cache(
  async () => {
    const admin = getAdminClientOrNull();
    if (!admin) {
      throw new Error("Supabase admin credentials are not configured.");
    }
    return loadWebsiteCustomers(admin);
  },
  ["nbh-admin-customers-website-v1"],
  {
    revalidate: 60,
    tags: ["nbh-admin-customers-website"],
  },
);

const loadCachedSquareCustomerSnapshot = unstable_cache(
  loadSquareCustomerSnapshot,
  ["nbh-admin-customers-square-v1"],
  {
    revalidate: 300,
    tags: ["nbh-admin-customers-square"],
  },
);

function mergeCustomers(
  websiteCustomers: WebsiteCustomer[],
  squareCustomers: SquareEnrolledCustomer[],
) {
  const merged = new Map<string, AdminCustomer>();
  const websiteByEmail = new Map<string, string>();
  const websiteByPhone = new Map<string, string>();

  for (const customer of websiteCustomers) {
    const key = `website:${customer.id}`;
    const emailKey = normaliseEmail(customer.email);
    const phoneKey = normalisePhone(customer.phone);

    if (emailKey) websiteByEmail.set(emailKey, key);
    if (phoneKey) websiteByPhone.set(phoneKey, key);

    merged.set(key, {
      ...customer,
      source: "website",
      squareEnrolled: false,
      squareDripPoints: null,
      squareLifetimePoints: null,
      squareCustomerId: null,
      squareLoyaltyAccountId: null,
      squareEnrolledAt: null,
    });
  }

  for (const square of squareCustomers) {
    const phoneKey = normalisePhone(square.phone);
    const emailKey = normaliseEmail(square.email);
    const websiteKey =
      (phoneKey ? websiteByPhone.get(phoneKey) : undefined) ||
      (emailKey ? websiteByEmail.get(emailKey) : undefined);

    if (websiteKey) {
      const website = merged.get(websiteKey);
      if (!website) continue;

      // Never replace a verified loyalty balance with an unenrolled
      // duplicate customer profile from Square's broader directory.
      if (website.squareEnrolled && !square.loyaltyAccountId) continue;

      merged.set(websiteKey, {
        ...website,
        name:
          website.name && website.name !== "Customer" ? website.name : square.name,
        email: website.email || square.email,
        phone: website.phone || square.phone,
        birthday: website.birthday || square.birthday,
        source: "both",
        squareEnrolled: Boolean(square.loyaltyAccountId),
        squareDripPoints: square.balance,
        squareLifetimePoints: square.lifetimePoints,
        squareCustomerId: square.squareCustomerId,
        squareLoyaltyAccountId: square.loyaltyAccountId,
        squareEnrolledAt: square.enrolledAt,
        updatedAt:
          square.updatedAt > website.updatedAt ? square.updatedAt : website.updatedAt,
      });
      continue;
    }

    const squareKey = `square:${square.loyaltyAccountId || square.squareCustomerId}`;
    merged.set(squareKey, {
      id: squareKey,
      name: square.name,
      email: square.email,
      phone: square.phone,
      birthday: square.birthday,
      source: "square",
      websiteAccount: false,
      squareEnrolled: Boolean(square.loyaltyAccountId),
      createdAt: square.enrolledAt || square.createdAt,
      updatedAt: square.updatedAt,
      emailConfirmedAt: null,
      lastSignInAt: null,
      orderCount: 0,
      lastOrderAt: null,
      websiteDripPoints: 0,
      squareDripPoints: square.balance,
      squareLifetimePoints: square.lifetimePoints,
      squareCustomerId: square.squareCustomerId,
      squareLoyaltyAccountId: square.loyaltyAccountId,
      squareEnrolledAt: square.enrolledAt,
    });
  }

  return [...merged.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function loadAdminCustomers(
  _admin: AdminClient,
): Promise<AdminCustomerPortalData> {
  // Authentication stays fully dynamic. Only the shared customer datasets are
  // cached, so returning to Customers can reuse a recent server result.
  const websitePromise = loadCachedWebsiteCustomers();
  const squarePromise = loadCachedSquareCustomerSnapshot()
    .then((snapshot) => ({ ok: true as const, snapshot }))
    .catch((error: unknown) => ({ ok: false as const, error }));

  const [websiteCustomers, squareResult] = await Promise.all([
    websitePromise,
    squarePromise,
  ]);

  if (squareResult.ok) {
    return {
      customers: mergeCustomers(
        websiteCustomers,
        squareResult.snapshot.customers,
      ),
      square: squareResult.snapshot.status,
    };
  }

  console.error("[NBH admin Square customer sync failed]", squareResult.error);
  return {
    customers: mergeCustomers(websiteCustomers, []),
    square: {
      connected: false,
      loyaltyCount: 0,
      directoryCount: null,
      directoryError: null,
      error:
        squareResult.error instanceof Error
          ? squareResult.error.message
          : "Square loyalty customers could not be loaded.",
    },
  };
}

/** Reuse the same Square account/profile joining as Customers, without also
 * fetching the entire website directory or customer order history. */
export async function loadAdminSquareLoyaltyMembers(): Promise<SquareEnrolledCustomer[]> {
  return loadSquareEnrolledCustomers(true);
}
