export type ServiceMode = "preview" | "open" | "closed";

export type ServiceConfiguration = {
  mode: ServiceMode;
  locationName: string;
  address: string;
  mapUrl: string | null;
  tradingHours: string;
  orderHours: {
    opensAt: string;
    closesAt: string;
  };
  prepTimeMinutes: {
    minimum: number;
    maximum: number;
  };
  timezone: string;
  closedMessage: string;
};

// Scheduled defaults. The admin shop control can override ordering status;
// all ordering entry points must use readShopStatus() on the server.
export const serviceConfiguration: ServiceConfiguration = {
  mode: "preview",
  // The owner-supplied Google Maps pin is authoritative. Do not reuse the old
  // Belconnen coordinates or claim a street address until the pin is resolved.
  locationName: "Nasty Burger House",
  address: "See Google Maps for the exact pickup location",
  mapUrl: "https://maps.app.goo.gl/PMtpCoAYnScYeiy28",
  tradingHours: "Online orders 11:30 AM–9:45 PM daily",
  orderHours: {
    opensAt: "11:30",
    closesAt: "21:45",
  },
  prepTimeMinutes: {
    minimum: 10,
    maximum: 15,
  },
  timezone: "Australia/Sydney",
  closedMessage:
    "Online ordering is paused right now. You can still browse the menu and check back shortly.",
};
