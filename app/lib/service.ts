import {
  serviceConfiguration,
  type ServiceConfiguration,
} from "../data/service";

export type ServiceStatus = {
  mode: ServiceConfiguration["mode"];
  acceptingOrders: boolean;
  statusLabel: string;
  statusTone: "preview" | "open" | "closed";
  locationName: string;
  address: string;
  mapUrl: string | null;
  tradingHours: string;
  prepTimeLabel: string;
  timezone: string;
  notice: string;
};

function parseClockMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function localMinutesInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const hours = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minutes = Number(parts.find((part) => part.type === "minute")?.value ?? 0);

  return hours * 60 + minutes;
}

export function getServiceStatus(
  configuration: ServiceConfiguration = serviceConfiguration,
  now: Date = new Date(),
): ServiceStatus {
  const prepTimeLabel = `${configuration.prepTimeMinutes.minimum}–${configuration.prepTimeMinutes.maximum} min`;

  if (configuration.mode === "closed") {
    return {
      mode: configuration.mode,
      acceptingOrders: false,
      statusLabel: "Ordering paused",
      statusTone: "closed",
      locationName: configuration.locationName,
      address: configuration.address,
      mapUrl: configuration.mapUrl,
      tradingHours: configuration.tradingHours,
      prepTimeLabel,
      timezone: configuration.timezone,
      notice: configuration.closedMessage,
    };
  }

  const currentMinutes = localMinutesInTimezone(now, configuration.timezone);
  const opensAtMinutes = parseClockMinutes(configuration.orderHours.opensAt);
  const closesAtMinutes = parseClockMinutes(configuration.orderHours.closesAt);
  const acceptingByTime =
    currentMinutes >= opensAtMinutes && currentMinutes < closesAtMinutes;

  if (!acceptingByTime) {
    const beforeOpening = currentMinutes < opensAtMinutes;

    return {
      mode: configuration.mode,
      acceptingOrders: false,
      statusLabel: beforeOpening
        ? "Online ordering opens at 11:00 AM"
        : "Online ordering closed for today",
      statusTone: "closed",
      locationName: configuration.locationName,
      address: configuration.address,
      mapUrl: configuration.mapUrl,
      tradingHours: configuration.tradingHours,
      prepTimeLabel,
      timezone: configuration.timezone,
      notice: beforeOpening
        ? "Online ordering opens at 11:00 AM Sydney time. Orders are available daily until 9:45 PM."
        : "Online ordering closed at 9:45 PM Sydney time. Orders reopen at 11:00 AM.",
    };
  }

  if (configuration.mode === "open") {
    return {
      mode: configuration.mode,
      acceptingOrders: true,
      statusLabel: "Open for pickup orders",
      statusTone: "open",
      locationName: configuration.locationName,
      address: configuration.address,
      mapUrl: configuration.mapUrl,
      tradingHours: configuration.tradingHours,
      prepTimeLabel,
      timezone: configuration.timezone,
      notice: "Pickup ordering is open. Preparation time may change during busy periods.",
    };
  }

  return {
    mode: configuration.mode,
    acceptingOrders: true,
    statusLabel: "Ordering preview active",
    statusTone: "preview",
    locationName: configuration.locationName,
    address: configuration.address,
    mapUrl: configuration.mapUrl,
    tradingHours: configuration.tradingHours,
    prepTimeLabel,
    timezone: configuration.timezone,
    notice:
      "Preview mode is active. Location and trading details are awaiting client confirmation.",
  };
}
