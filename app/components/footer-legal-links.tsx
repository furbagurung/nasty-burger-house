"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function FooterLegalLinks() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.querySelector<HTMLElement>(".site-footer .footer-bottom"));
  }, []);

  if (!target) return null;

  return createPortal(
    <nav className="footer-legal-links" aria-label="Legal links">
      <Link href="/privacy-policy">Privacy Policy</Link>
      <Link href="/terms-and-conditions">Terms and Conditions</Link>
    </nav>,
    target,
  );
}
