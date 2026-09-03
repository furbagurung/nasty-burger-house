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

export function getServiceStatus(
  configuration: ServiceConfiguration = serviceConfiguration,
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
