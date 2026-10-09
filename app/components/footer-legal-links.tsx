"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SocialIcon from "./social-icons";

export function FooterUtilityLinks() {
  const openCookieSettings = () => {
    window.dispatchEvent(new Event("nasty:open-cookie-settings"));
  };

  return (
    <nav className="footer-legal-links" aria-label="Support, social and legal links">
      <Link href="/help-support">Help &amp; Support</Link>
      <Link href="/reviews">Customer Reviews</Link>

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
  const pathname = usePathname();

  // Admin workspaces and login have their own layout. Never show customer
  // marketing, social, privacy or cookie links beneath admin screens.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;

  // Focused authentication screens use a Back to Home link instead of a
  // distracting site footer or mobile tab bar.
  if (
    pathname === "/account/sign-in" ||
    pathname === "/account/create" ||
    pathname === "/account/forgot-password" ||
    pathname === "/account/reset-password"
  ) return null;

  // These pages render their utility links inside their own React-owned footer.
  if (pathname === "/" || pathname.startsWith("/menu/") || pathname.startsWith("/product/")) return null;

  return (
    <footer className="utility-footer">
      <span>© 2026 Nasty Burger House</span>
      <span className="footer-credit">Made with love by Furba Gurung</span>
      <FooterUtilityLinks />
    </footer>
  );
}
