export type ServiceMode = "preview" | "open" | "closed";

export type ServiceConfiguration = {
  mode: ServiceMode;
  locationName: string;
  address: string;
  mapUrl: string | null;
  tradingHours: string;
  prepTimeMinutes: {
    minimum: number;
    maximum: number;
  };
  timezone: string;
  closedMessage: string;
};

// Phase 4 keeps every operational value in one place. Change `mode` to
// "open" after the client confirms these details, or "closed" to pause
// checkout immediately. A future admin/POS integration can replace this
// object without changing the customer-facing components.
export const serviceConfiguration: ServiceConfiguration = {
  mode: "preview",
  locationName: "Franklin Woolworths Carpark",
  address: "Franklin, ACT",
  mapUrl: null,
  tradingHours: "12 PM–10 PM · awaiting confirmation",
  prepTimeMinutes: {
    minimum: 10,
    maximum: 15,
  },
  timezone: "Australia/Sydney",
  closedMessage:
    "Online ordering is paused right now. You can still browse the menu and check back shortly.",
};
