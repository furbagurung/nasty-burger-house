"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { serviceConfiguration } from "../data/service";

const GOOGLE_MAPS_URL = serviceConfiguration.mapUrl;

export default function FindUsSection() {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

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

  if (!portalTarget) return null;

  return createPortal(
    <section className="find-us-section" aria-labelledby="find-us-title">
      <div className="find-us-section__inner">
        <div className="find-us-section__copy">
          <p className="eyebrow">Find us</p>
          <h2 id="find-us-title">Come get Nasty.</h2>
          <div className="find-us-section__location">
            <small>Pickup location</small>
            <strong>{serviceConfiguration.locationName}</strong>
            <span>See the latest pin for our exact location.</span>
          </div>
          {GOOGLE_MAPS_URL && (
            <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer">
              Get directions <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>

        <div className="find-us-section__map">
          {GOOGLE_MAPS_URL ? (
            <a
              className="find-us-section__map-preview"
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open the current Nasty Burger House pickup location in Google Maps (new tab)"
            >
              <svg
                className="find-us-section__map-art"
                viewBox="0 0 700 460"
                preserveAspectRatio="xMidYMid slice"
                aria-hidden="true"
                focusable="false"
              >
                <rect width="700" height="460" fill="var(--nb-dark-surface)" />
                <g fill="none" stroke="var(--nb-dark-hover)" strokeWidth="78" strokeLinecap="round">
                  <path d="M-55 340 C185 270 280 440 750 310" />
                  <path d="M170 -80 C275 90 350 205 315 540" />
                  <path d="M-50 65 C225 155 410 15 755 100" />
                </g>
                <g fill="none" stroke="var(--nb-dark-border)" strokeWidth="12" strokeLinecap="round">
                  <path d="M-55 340 C185 270 280 440 750 310" />
                  <path d="M170 -80 C275 90 350 205 315 540" />
                  <path d="M-50 65 C225 155 410 15 755 100" />
                </g>
              </svg>
              <span className="find-us-section__map-card">
                <span className="find-us-section__map-eyebrow">Pickup location</span>
                <span className="find-us-section__map-title">Nasty Burger House</span>
                <span className="find-us-section__map-open">
                  View Google Maps <span aria-hidden="true">↗</span>
                </span>
              </span>
              <span className="find-us-section__map-note">
                Illustrated preview · Open Maps for the exact pin
              </span>
            </a>
          ) : (
            <p className="find-us-section__map-fallback">Map location unavailable.</p>
          )}
        </div>
      </div>
    </section>,
    portalTarget,
  );
}
