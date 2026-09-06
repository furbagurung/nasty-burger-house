"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/35%C2%B014%2714.5%22S+149%C2%B003%2753.4%22E/@-35.2373611,149.0648333,17z/data=!3m1!4b1!4m4!3m3!8m2!3d-35.2373611!4d149.0648333!18m1!1e1?entry=ttu";
const GOOGLE_MAPS_EMBED_URL =
  "https://www.google.com/maps?q=-35.2373611,149.0648333&z=17&output=embed";
const LOCATION_COORDINATES = `35°14'14.5\"S 149°03'53.4\"E`;

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
          <p>
            Plan your pickup, get directions and come hungry. Use the map for
            the exact Nasty Burger House pickup location.
          </p>
          <div className="find-us-section__location">
            <small>Exact location</small>
            <strong>{LOCATION_COORDINATES}</strong>
          </div>
          <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer">
            Open in Google Maps <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="find-us-section__map">
          <iframe
            src={GOOGLE_MAPS_EMBED_URL}
            title="Nasty Burger House pickup location"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>,
    portalTarget,
  );
}
