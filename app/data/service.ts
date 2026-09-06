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
  locationName: "Belconnen",
  address: "Belconnen ACT 2617",
  mapUrl:
    "https://www.google.com/maps/place/35%C2%B014%2714.5%22S+149%C2%B003%2753.4%22E/@-35.2373611,149.0648333,17z/data=!3m1!4b1!4m4!3m3!8m2!3d-35.2373611!4d149.0648333!18m1!1e1?entry=ttu",
  tradingHours: "12 PM–10 PM · awaiting confirmation",
  prepTimeMinutes: {
    minimum: 10,
    maximum: 15,
  },
  timezone: "Australia/Sydney",
  closedMessage:
    "Online ordering is paused right now. You can still browse the menu and check back shortly.",
};
