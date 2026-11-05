import "server-only";

import { getAdminClientOrNull } from "./supabase/admin";
import { listAllSquareLoyaltyAccounts, type SquareLoyaltyAccount } from "./square/loyalty";
import { squareRequest } from "./square/api";

type AdminClient = NonNullable<ReturnType<typeof getAdminClientOrNull>>;

type WebsiteProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

type Ledger = {
  customer_id: string;
  points: number;
  points_status: string;
};

type SquareProfile = {
  id?: string;
  given_name?: string;
  family_name?: string;
  email_address?: string;
  phone_number?: string;
};

export type LoyaltyAuditRow = {
  id: string;
  name: string;
  websiteEmail: string | null;
  squareEmail: string | null;
  phone: string | null;
  websitePoints: number | null;
  pendingWebsitePoints: number | null;
  squarePoints: number | null;
  difference: number | null;
  match: "verified-email" | "phone-and-name" | "phone-only" | "none" | "ambiguous";
  status: "different" | "same" | "review" | "website-only" | "square-only" | "unavailable";
  explanation: string;
  websiteId: string | null;
  squareCustomerId: string | null;
  squareLoyaltyId: string | null;
};

export type DuplicateWebsitePhone = {
  phone: string;
  profiles: Array<{
    id: string;
    name: string;
    email: string;
    confirmed: boolean;
    websitePoints: number;
  }>;
};

export type LoyaltyAudit = {
  checkedAt: string;
  websiteCount: number;
  squareCount: number | null;
  squareError: string | null;
  differentCount: number;
  confirmedCount: number;
  reviewCount: number;
  rows: LoyaltyAuditRow[];
  duplicatePhones: DuplicateWebsitePhone[];
};

export function normalizeAuMobile(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (/^04\d{8}$/.test(digits)) return `61${digits.slice(1)}`;
  if (/^614\d{8}$/.test(digits)) return digits;
  return "";
}

function emailKey(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function nameKey(value: string | null | undefined) {
  return (value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "");
}

function squarePersonName(value: SquareProfile | undefined) {
  return [value?.given_name?.trim(), value?.family_name?.trim()]
    .filter(Boolean).join(" ") || "Square loyalty member";
}

function groupBy<T>(items: T[], keyFn: (item: T) => string) {
  const result = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    result.set(key, [...(result.get(key) ?? []), item]);
  }
  return result;
}

type SquareMember = {
  id: string;
  customerId: string | null;
  name: string;
  email: string;
  phone: string;
  points: number | null;
};

async function squareMembers(accounts: SquareLoyaltyAccount[]): Promise<SquareMember[]> {
  const ids = [...new Set(accounts.map((item) => item.customer_id).filter(
    (id): id is string => Boolean(id),
  ))];
  const profiles = new Map<string, SquareProfile>();

  for (let index = 0; index < ids.length; index += 100) {
    const customerIds = ids.slice(index, index + 100);
    const response = await squareRequest<{
      responses?: Record<string, { customer?: SquareProfile }>;
    }>("/v2/customers/bulk-retrieve", {
      method: "POST",
      body: JSON.stringify({ customer_ids: customerIds }),
    });
    for (const [id, value] of Object.entries(response.responses ?? {})) {
      if (value.customer) profiles.set(id, value.customer);
    }
  }

  return accounts.map((account) => {
    const profile = account.customer_id ? profiles.get(account.customer_id) : undefined;
    return {
      id: account.id,
      customerId: account.customer_id ?? null,
      name: squarePersonName(profile),
      email: emailKey(profile?.email_address),
      phone: normalizeAuMobile(account.mapping?.phone_number ?? profile?.phone_number),
      points: typeof account.balance === "number" && Number.isFinite(account.balance)
        ? account.balance : null,
    };
  });
}

/**
 * Read-only audit. No Square account creation, sign-up bonuses, point
 * adjustments, Auth user changes, or database mutations.
 */
export async function loadAdminLoyaltyAudit(admin: AdminClient): Promise<LoyaltyAudit> {
  const [profileResult, ledgerResult, aliasesResult, authResult] = await Promise.all([
    admin.from("customers").select("id,name,email,phone"),
    admin.from("drip_ledger").select("customer_id,points,points_status"),
    admin.from("customer_email_aliases").select("user_id,email")
      .not("verified_at", "is", null),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (ledgerResult.error) throw ledgerResult.error;
  if (aliasesResult.error) throw aliasesResult.error;
  if (authResult.error) throw authResult.error;

  const websites = (profileResult.data ?? []) as WebsiteProfile[];
  const ledger = (ledgerResult.data ?? []) as Ledger[];
  const verifiedIds = new Set(
    authResult.data.users.filter((user) => Boolean(user.email_confirmed_at))
      .map((user) => user.id),
  );
  const pointsById = new Map<string, { available: number; pending: number }>();
  for (const entry of ledger) {
    const current = pointsById.get(entry.customer_id) ?? { available: 0, pending: 0 };
    if (entry.points_status === "available") current.available += Number(entry.points) || 0;
    if (entry.points_status === "pending") current.pending += Number(entry.points) || 0;
    pointsById.set(entry.customer_id, current);
  }

  const aliases = new Map<string, Set<string>>();
  for (const alias of aliasesResult.data ?? []) {
    const existing = aliases.get(alias.user_id) ?? new Set<string>();
    existing.add(emailKey(alias.email));
    aliases.set(alias.user_id, existing);
  }

  const byPhone = groupBy(websites, (w) => normalizeAuMobile(w.phone));
  const duplicatePhones = [...byPhone.entries()]
    .filter(([, members]) => members.length > 1)
    .map(([phone, members]) => ({
      phone: `+${phone}`,
      profiles: members.map((w) => ({
        id: w.id, name: w.name, email: w.email,
        confirmed: verifiedIds.has(w.id),
        websitePoints: pointsById.get(w.id)?.available ?? 0,
      })),
    }))
    .sort((a, b) => b.profiles.length - a.profiles.length);

  let members: SquareMember[] = [];
  let squareError: string | null = null;
  try {
    members = await squareMembers(await listAllSquareLoyaltyAccounts());
  } catch (error) {
    console.error("[NBH loyalty audit] Square read unavailable", error);
    squareError = "Square loyalty balances could not be retrieved. Website results are shown without a comparison.";
  }

  const squareByEmail = groupBy(members, (member) => member.email);
  const squareByPhone = groupBy(members, (member) => member.phone);
  const claimedSquare = new Set<string>();
  const rows: LoyaltyAuditRow[] = [];
  let confirmedCount = 0;
  let differentCount = 0;
  let reviewCount = 0;

  for (const website of websites) {
    const phone = normalizeAuMobile(website.phone);
    const names = new Set<string>();
    if (verifiedIds.has(website.id)) names.add(emailKey(website.email));
    for (const alias of aliases.get(website.id) ?? []) names.add(alias);
    const direct = [...new Map([...names].flatMap((email) =>
      (squareByEmail.get(email) ?? []).map((m) => [m.id, m] as const),
    )).values()];
    const balance = pointsById.get(website.id) ?? { available: 0, pending: 0 };

    let member: SquareMember | null = null;
    let match: LoyaltyAuditRow["match"] = "none";
    let status: LoyaltyAuditRow["status"] = squareError ? "unavailable" : "website-only";
    let explanation = squareError
      ? "Square could not be loaded."
      : "No verified email match to a Square loyalty account.";

    if (!squareError && direct.length > 1) {
      match = "ambiguous"; status = "review";
      explanation = "Multiple Square loyalty accounts use an email verified for this website user.";
    } else if (!squareError && direct.length === 1) {
      member = direct[0];
      match = "verified-email";
      if (claimedSquare.has(member.id)) {
        member = null;
        match = "ambiguous"; status = "review";
        explanation = "This Square loyalty account matches more than one website profile.";
      } else {
        claimedSquare.add(member.id);
        confirmedCount += 1;
        status = member.points === null ? "review"
          : member.points === balance.available ? "same" : "different";
        if (status === "different") differentCount += 1;
        explanation = status === "different"
          ? "Different available balances; website ledger may be historical. Square is authoritative."
          : status === "same" ? "Verified email and equal available balances."
          : "Square did not return an available-points balance.";
      }
    } else if (!squareError && phone) {
      const phoneMatches = squareByPhone.get(phone) ?? [];
      const namedMatches = phoneMatches.filter(
        (candidate) => nameKey(candidate.name) === nameKey(website.name) &&
          Boolean(nameKey(website.name)) &&
          candidate.name !== "Square loyalty member",
      );
      const possible = namedMatches.length ? namedMatches : phoneMatches;
      if (possible.length === 1) {
        member = possible[0];
        match = namedMatches.length ? "phone-and-name" : "phone-only";
        status = "review";
        explanation = (byPhone.get(phone)?.length ?? 0) > 1
          ? "Multiple website accounts share this phone. Verify ownership before linking."
          : "Phone/name is a candidate only. Verify both identities before linking.";
      } else if (possible.length > 1) {
        match = "ambiguous"; status = "review";
        explanation = "Multiple Square loyalty accounts match the phone; review manually.";
      }
    }
    if (status === "review") reviewCount += 1;

    rows.push({
      id: `website:${website.id}`,
      name: website.name,
      websiteEmail: website.email,
      squareEmail: member?.email || null,
      phone: phone ? `+${phone}` : (member?.phone ? `+${member.phone}` : null),
      websitePoints: balance.available,
      pendingWebsitePoints: balance.pending,
      squarePoints: member?.points ?? null,
      difference: match === "verified-email" && member?.points !== null && member?.points !== undefined
        ? member.points - balance.available : null,
      match, status, explanation,
      websiteId: website.id,
      squareCustomerId: member?.customerId ?? null,
      squareLoyaltyId: member?.id ?? null,
    });
  }

  if (!squareError) {
    for (const square of members) {
      if (claimedSquare.has(square.id)) continue;
      rows.push({
        id: `square:${square.id}`,
        name: square.name, websiteEmail: null, squareEmail: square.email || null,
        phone: square.phone ? `+${square.phone}` : null,
        websitePoints: null, pendingWebsitePoints: null,
        squarePoints: square.points, difference: null, match: "none",
        status: "square-only",
        explanation: "Square loyalty account without a unique verified website email match.",
        websiteId: null, squareCustomerId: square.customerId, squareLoyaltyId: square.id,
      });
    }
  }

  const statusOrder: Record<LoyaltyAuditRow["status"], number> = {
    different: 0, review: 1, website-only: 2, square-only: 3, unavailable: 4, same: 5,
  };
  rows.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]
    || a.name.localeCompare(b.name));

  return {
    checkedAt: new Date().toISOString(),
    websiteCount: websites.length,
    squareCount: squareError ? null : members.length,
    squareError, differentCount, confirmedCount, reviewCount,
    rows, duplicatePhones,
  };
}
