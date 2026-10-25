import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

const example = {
  orderId: "NBH-ABCD1234",
  squareOrderId: "SQORDER1234",
  paymentId: "PAY1234",
  paidAt: "2026-10-24T09:00:00Z",
  customer: { name: "Omer <script>", email: "customer@example.com", phone: "+61400000000" },
  locationName: "Belconnen",
  notes: "No <onion>",
  lines: [{ name: "Beast & Fries <script>", quantity: 2, lineTotal: 59.99, details: ["No <pickles>"] }],
  total: 59.99,
};

function getCustomerRenderer() {
  const source = read("app/lib/email/paid-order-template.ts")
    .replace('import "server-only";', "")
    .replace(/import type \{ PaidOrderNotification \} from ".*";/, "")
    .replace("} as const;", "};")
    .replaceAll("payload: PaidOrderNotification", "payload")
    .replaceAll("export function", "function");
  return vm.runInNewContext(source + "\nrenderCustomerPaidOrderEmail");
}

test("Square payment link prepopulates validated buyer contact information", () => {
  const code = read("app/lib/square/checkout.ts");
  assert.match(code, /pre_populated_data:\s*\{/);
  assert.match(code, /buyer_email:\s*payload\.customer\.email/);
  assert.match(code, /buyer_phone_number:\s*customer\.phone/);
});

test("customer confirmation is separate from the admin alert and after verified Square payment", () => {
  const code = read("app/api/square/webhooks/route.ts");
  assert.match(code, /payment\.status !== "COMPLETED"/);
  assert.match(code, /squareRequest<\{ payment\?: SquarePaidPayment \}>\(/);
  assert.match(code, /createPaidSquareOrderNotifications\(/);
  assert.match(code, /sendAdminPaidOrderEmail\(notification\.email\)/);
  assert.match(code, /sendCustomerPaidOrderEmail\(notification\.email\)/);
  assert.match(code, /customerEmailFailed/);
});

test("customer email contains receipt details and escapes untrusted content", () => {
  const { html, text } = getCustomerRenderer()(example);
  assert.match(html, /Order confirmed &amp; paid/);
  assert.match(html, /NBH-ABCD1234/);
  assert.match(html, /\$59\.99/);
  assert.match(html, /Belconnen/);
  assert.match(html, /Beast &amp; Fries/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /No &lt;pickles&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /Open Admin Orders|\/admin\/orders|RESTAURANT ORDER ALERT/);
  assert.match(text, /Order: NBH-ABCD1234/);
  assert.match(text, /\$59\.99/);
  assert.doesNotMatch(text, /Admin Orders/);
});

test("customer receives confirmation with hidden, unique admin copies", async () => {
  const source = read("app/lib/customer-notifications.ts")
    .replace('import "server-only";', "")
    .replace(/import type .*;\n/g, "")
    .replace(/import \{ .* \} from ".*";\n/g, "")
    .replace(/type CustomerEmailResult =[\s\S]*?;\n\n/, "")
    .replace("payload: PaidOrderNotification): Promise<CustomerEmailResult>", "payload)")
    .replace("function adminBccRecipients(value: string | undefined, buyerEmail: string): string[] {", "function adminBccRecipients(value, buyerEmail) {")
    .replace("export async function", "async function");
  const requests = [];
  const env = {
    RESEND_API_KEY: "test-key",
    ORDER_NOTIFICATION_FROM: "Nasty Burger House <alerts@example.com>",
    ORDER_NOTIFICATION_EMAIL: " Admin@example.com, office@example.com, ADMIN@example.com, CUSTOMER@example.com, invalid-address, office@example.com ",
  };
  const send = vm.runInNewContext(source + "\nsendCustomerPaidOrderEmail", {
    process: { env },
    renderCustomerPaidOrderEmail: () => ({ html: "<b>Paid</b>", text: "Paid" }),
    wasResendEmailAlreadyAccepted: () => false,
    fetch: async (url, init) => {
      requests.push({ url, init });
      return { ok: true };
    },
    AbortSignal,
    console,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(await send(example))), { ok: true });
  assert.equal(requests.length, 1);
  const message = JSON.parse(requests[0].init.body);
  assert.deepEqual(message.to, ["customer@example.com"]);
  assert.deepEqual(message.bcc, ["Admin@example.com", "office@example.com"]);
  assert.ok(!message.to.includes("admin@example.com"));
  assert.ok(!message.to.includes("office@example.com"));
  assert.equal(message.cc, undefined);
  assert.equal(message.reply_to, undefined);
  assert.equal(message.subject, "Order confirmed & paid · NBH-ABCD1234");
  assert.equal(requests[0].init.headers["Idempotency-Key"], "nasty-customer-paid-SQORDER1234");
  assert.notEqual(requests[0].init.headers["Idempotency-Key"], "nasty-paid-square-SQORDER1234");
  env.ORDER_NOTIFICATION_EMAIL = "CUSTOMER@example.com, customer@example.com";
  await send({ ...example, squareOrderId: "SQORDER1235" });
  const selfCopy = JSON.parse(requests[1].init.body);
  assert.equal(selfCopy.bcc, undefined, "buyer who is an admin must not get a duplicate copy");

  env.ORDER_NOTIFICATION_EMAIL = "";
  await send({ ...example, squareOrderId: "SQORDER1236" });
  const noAdmins = JSON.parse(requests[2].init.body);
  assert.equal(noAdmins.bcc, undefined, "missing admin list should not break buyer email");

  await send({ ...example, customer: { ...example.customer, email: "" } });
  assert.equal(requests.length, 3, "empty customer email must not send a message");
});
