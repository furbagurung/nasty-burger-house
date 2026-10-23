import { serviceConfiguration, type ServiceConfiguration } from "../data/service";
import { formatShopClock, formatShopHours } from "./shop-control";

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
    timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
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
  const base = {
    locationName: configuration.locationName, address: configuration.address,
    mapUrl: configuration.mapUrl,
    tradingHours: `Online orders ${formatShopHours(configuration.orderHours)} daily`,
    prepTimeLabel, timezone: configuration.timezone,
  };
  if (configuration.mode === "closed") {
    return { ...base, mode: configuration.mode, acceptingOrders: false, statusLabel: "Ordering paused",
      statusTone: "closed", notice: configuration.closedMessage };
  }
  const current = localMinutesInTimezone(now, configuration.timezone);
  const open = parseClockMinutes(configuration.orderHours.opensAt);
  const close = parseClockMinutes(configuration.orderHours.closesAt);
  const opensAt = formatShopClock(configuration.orderHours.opensAt);
  const closesAt = formatShopClock(configuration.orderHours.closesAt);
  if (current < open || current >= close) {
    const beforeOpening = current < open;
    return { ...base, mode: configuration.mode, acceptingOrders: false,
      statusLabel: beforeOpening ? `Online ordering opens at ${opensAt}` : "Online ordering closed for today",
      statusTone: "closed",
      notice: beforeOpening
        ? `Online ordering opens at ${opensAt} Sydney time. Orders are available daily until ${closesAt}.`
        : `Online ordering closed at ${closesAt} Sydney time. Orders reopen at ${opensAt}.` };
  }
  if (configuration.mode === "open") {
    return { ...base, mode: configuration.mode, acceptingOrders: true,
      statusLabel: "Open for pickup orders", statusTone: "open",
      notice: "Pickup ordering is open. Preparation time may change during busy periods." };
  }
  return { ...base, mode: configuration.mode, acceptingOrders: true,
    statusLabel: "Ordering preview active", statusTone: "preview",
    notice: "Preview mode is active. Location and trading details are awaiting client confirmation." };
}
