"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import SocialIcon from "./social-icons";

function FooterUtilityLinks() {
  const openCookieSettings = () => {
    window.dispatchEvent(new Event("nasty:open-cookie-settings"));
  };

  return (
    <nav className="footer-legal-links" aria-label="Support, social and legal links">
      <Link href="/help-support">Help &amp; Support</Link>

      <span className="footer-social-links" aria-label="Nasty Burger House social media">
        <a
          href="https://www.instagram.com/nastyburgerhouse/"
          target="_blank"
          rel="noreferrer"
          aria-label="Nasty Burger House on Instagram"
          title="Instagram"
        >
          <SocialIcon name="instagram" />
        </a>
        <a
          href="https://www.tiktok.com/@nastyburgerhouse"
          target="_blank"
          rel="noreferrer"
          aria-label="Nasty Burger House on TikTok"
          title="TikTok"
        >
          <SocialIcon name="tiktok" />
        </a>
        <a
          href="https://www.facebook.com/profile.php?id=61590139712227"
          target="_blank"
          rel="noreferrer"
          aria-label="Nasty Burger House on Facebook"
          title="Facebook"
        >
          <SocialIcon name="facebook" />
        </a>
      </span>

      <Link href="/privacy-policy">Privacy Policy</Link>
      <Link href="/terms-and-conditions">Terms and Conditions</Link>
      <button type="button" onClick={openCookieSettings}>
        Cookie Settings
      </button>
    </nav>
  );
}

export default function FooterLegalLinks() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTarget(
      document.querySelector<HTMLElement>(
        ".site-footer .footer-bottom, .catalogue-footer",
      ),
    );
    setReady(true);
  }, []);

  if (!ready) return null;

  if (target) {
    return createPortal(<FooterUtilityLinks />, target);
  }

  return (
    <footer className="utility-footer">
      <span>© 2026 Nasty Burger House</span>
      <FooterUtilityLinks />
    </footer>
  );
}
