"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { serviceConfiguration } from "../data/service";

const GOOGLE_MAPS_URL = serviceConfiguration.mapUrl;

export default function FindUsSection() {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [mapState, setMapState] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    const footer = document.querySelector<HTMLElement>(".site-shell > .site-footer");
    const parent = footer?.parentElement;
    if (!footer || !parent) return;

    const host = document.createElement("div");
    host.className = "find-us-portal-host";
    host.id = "find-us";
    parent.insertBefore(host, footer);
    setPortalTarget(host);

    if (window.location.hash === "#find-us") {
      window.setTimeout(() => host.scrollIntoView({ block: "start" }), 0);
    }

    return () => {
      host.remove();
    };
  }, []);

  useEffect(() => {
    if (!GOOGLE_MAPS_URL) return;

    const controller = new AbortController();
    async function loadMap() {
      try {
        const response = await fetch("/api/pickup-map", {
          signal: controller.signal,
          cache: "default",
        });
        if (!response.ok) throw new Error("Pickup map unavailable");
        const data: { embedUrl?: unknown } = await response.json();
        const nextUrl = typeof data.embedUrl === "string" ? data.embedUrl : null;
        if (controller.signal.aborted) return;
        if (nextUrl && /^https:\/\/www\.google\.com\/maps\?/.test(nextUrl)) {
          setEmbedUrl(nextUrl);
          setMapState("ready");
        } else {
          setMapState("unavailable");
        }
      } catch {
        if (!controller.signal.aborted) setMapState("unavailable");
      }
    }
    void loadMap();
    return () => controller.abort();
  }, []);

  if (!portalTarget) return null;

  return createPortal(
    <section className="find-us-section" aria-labelledby="find-us-title">
      <div className="find-us-section__inner">
        <div className="find-us-section__copy">
          <p className="eyebrow">Location</p>
          <h2 id="find-us-title">Find the truck.</h2>
        </div>

        <div className="find-us-section__map">
          {GOOGLE_MAPS_URL ? (
            <>
              {embedUrl ? (
                <iframe
                  className="find-us-section__map-iframe"
                  title="Google Maps showing the current Nasty Burger House pickup location"
                  src={embedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <div className="find-us-section__map-status" role="status" aria-live="polite">
                  <strong>
                    {mapState === "loading"
                      ? "Loading map…"
                      : "Map unavailable"}
                  </strong>
                  <span>
                    {mapState === "loading"
                      ? "Finding our pickup pin."
                      : "Use Open map for the exact pin."}
                  </span>
                </div>
              )}
              <a
                className="find-us-section__map-link"
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open the exact Nasty Burger House pickup location in Google Maps (new tab)"
              >
                Open map <span aria-hidden="true">↗</span>
              </a>
            </>
          ) : (
            <p className="find-us-section__map-fallback">Location unavailable.</p>
          )}
        </div>
      </div>
    </section>,
    portalTarget,
  );
}
