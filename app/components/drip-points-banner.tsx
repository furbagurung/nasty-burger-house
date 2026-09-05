"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

function openDripPoints() {
  const control = document.querySelector<HTMLButtonElement>(
    ".site-shell > .site-header .nav-button",
  );

  if (control) {
    control.click();
    return;
  }

  window.location.href = "/?loyalty=1";
}

export default function DripPointsBanner() {
  const pathname = usePathname();
  const [host, setHost] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (pathname !== "/") {
      setHost(null);
      return;
    }

    const menuPreview = document.querySelector<HTMLElement>(".menu-preview");
    if (!menuPreview?.parentElement) return;

    let portalHost = document.querySelector<HTMLDivElement>(
      ".drip-points-banner-host",
    );

    if (!portalHost) {
      portalHost = document.createElement("div");
      portalHost.className = "drip-points-banner-host";
      menuPreview.parentElement.insertBefore(portalHost, menuPreview.nextSibling);
    }

    setHost(portalHost);

    return () => {
      portalHost?.remove();
      setHost(null);
    };
  }, [pathname]);

  if (!host) return null;

  return createPortal(
    <section className="drip-points-banner" aria-labelledby="drip-banner-title">
      <div className="drip-points-banner__inner">
        <div className="drip-points-banner__copy">
          <p className="drip-points-banner__eyebrow">Nasty Rewards</p>
          <h2 id="drip-banner-title">Get rewarded for getting Nasty.</h2>
          <p className="drip-points-banner__body">
            Join Drip Points and start with 500 points. Keep ordering, keep
            earning, and unlock rewards made for hungry regulars.
          </p>
          <div className="drip-points-banner__meta" aria-label="Drip Points benefits">
            <span>500 points to start</span>
            <span>Rewards for regulars</span>
          </div>
          <button
            className="drip-points-banner__cta"
            type="button"
            onClick={openDripPoints}
          >
            Join Drip Points
          </button>
        </div>

        <div className="drip-points-banner__art" aria-hidden="true">
          <span className="drip-points-banner__glow" />
          <Image
            className="drip-points-banner__coin"
            src="/images/drip-points/drip-coin.png"
            alt=""
            width={620}
            height={620}
            sizes="(max-width: 680px) 46vw, 360px"
          />
          <Image
            className="drip-points-banner__logo"
            src="/logo.webp"
            alt=""
            width={256}
            height={256}
          />
        </div>
      </div>
    </section>,
    host,
  );
}
