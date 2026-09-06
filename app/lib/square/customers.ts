import "server-only";

import { squareRequest } from "./api";

type SquareCustomer = {
  id?: string;
  given_name?: string;
  family_name?: string;
  email_address?: string;
  phone_number?: string;
};

type SearchCustomersResponse = {
  customers?: SquareCustomer[];
};

type CreateCustomerResponse = {
  customer?: SquareCustomer;
};

export type SquareCustomerInput = {
  name: string;
  email: string;
  phone: string;
  requestId: string;
};

export function normalizeAustralianPhone(phone: string) {
  const compact = phone.trim().replace(/[()\s-]/g, "");
  if (!compact) return "";

  if (compact.startsWith("+")) {
    return `+${compact.slice(1).replace(/\D/g, "")}`;
  }

  const digits = compact.replace(/\D/g, "");
  if (digits.startsWith("61")) return `+${digits}`;
  if (digits.startsWith("0")) return `+61${digits.slice(1)}`;
  return digits ? `+61${digits}` : "";
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    givenName: parts[0] || "Customer",
    familyName: parts.slice(1).join(" ") || undefined,
  };
}

async function searchCustomerByEmail(email: string) {
  const result = await squareRequest<SearchCustomersResponse>(
    "/v2/customers/search",
    {
      method: "POST",
      body: JSON.stringify({
        limit: 1,
        query: {
          filter: {
            email_address: { exact: email.trim().toLowerCase() },
          },
        },
      }),
    },
  );
  return result.customers?.[0] ?? null;
}

async function searchCustomerByPhone(phone: string) {
  if (!phone) return null;
  const result = await squareRequest<SearchCustomersResponse>(
    "/v2/customers/search",
    {
      method: "POST",
      body: JSON.stringify({
        limit: 1,
        query: {
          filter: {
            phone_number: { exact: phone },
          },
        },
      }),
    },
  );
  return result.customers?.[0] ?? null;
}

export async function findOrCreateSquareCustomer(input: SquareCustomerInput) {
  const email = input.email.trim().toLowerCase();
  const phone = normalizeAustralianPhone(input.phone);

  const byEmail = await searchCustomerByEmail(email);
  if (byEmail?.id) {
    return { id: byEmail.id, created: false, phone };
  }

  const byPhone = await searchCustomerByPhone(phone);
  if (byPhone?.id) {
    return { id: byPhone.id, created: false, phone };
  }

  const { givenName, familyName } = splitName(input.name);
  const result = await squareRequest<CreateCustomerResponse>("/v2/customers", {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: `nbh-customer-${input.requestId}`.slice(0, 192),
      given_name: givenName,
      ...(familyName ? { family_name: familyName } : {}),
      email_address: email,
      phone_number: phone,
      reference_id: `nbh-web-${input.requestId}`.slice(0, 100),
      note: "Created by Nasty Burger House web checkout.",
    }),
  });

  if (!result.customer?.id) {
    throw new Error("Square did not return a customer ID.");
  }

  return { id: result.customer.id, created: true, phone };
}
