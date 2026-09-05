"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps?ll=-35.191387,149.155361&z=17&t=m&hl=en-US&gl=US&mapclient=embed&q=Gungahlin+ACT+2912";
const GOOGLE_MAPS_EMBED_URL =
  "https://www.google.com/maps?q=-35.191387,149.155361&z=17&output=embed";

export default function FindUsSection() {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const footer = document.querySelector<HTMLElement>(".site-shell > .site-footer");
    const parent = footer?.parentElement;
    if (!footer || !parent) return;

    const host = document.createElement("div");
    host.className = "find-us-portal-host";
    parent.insertBefore(host, footer);
    setPortalTarget(host);

    return () => {
      setPortalTarget(null);
      host.remove();
    };
  }, []);

  if (!portalTarget) return null;

  return createPortal(
    <section className="find-us-section" id="find-us" aria-labelledby="find-us-title">
      <div className="find-us-section__inner">
        <div className="find-us-section__copy">
          <p className="eyebrow">Find us</p>
          <h2 id="find-us-title">Come get Nasty in Gungahlin.</h2>
          <p>
            Find Nasty Burger House in Gungahlin, ACT. Plan your pickup, get
            directions and come hungry.
          </p>
          <div className="find-us-section__location">
            <small>Location</small>
            <strong>Gungahlin ACT 2912</strong>
          </div>
          <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer">
            Open in Google Maps <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="find-us-section__map">
          <iframe
            src={GOOGLE_MAPS_EMBED_URL}
            title="Nasty Burger House location in Gungahlin ACT"
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
