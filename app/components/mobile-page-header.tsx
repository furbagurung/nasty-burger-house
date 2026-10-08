import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type MobilePageHeaderProps = {
  title: string;
  eyebrow?: string;
  backHref: string;
  backLabel?: string;
  detail?: ReactNode;
};

/**
 * Reusable mobile-only, app-style page header.
 * Cart uses it now; other customer pages can reuse it without copying markup.
 * The corresponding CSS hides it above the mobile breakpoint.
 */
export default function MobilePageHeader({
  title,
  eyebrow,
  backHref,
  backLabel = "Go back",
  detail,
}: MobilePageHeaderProps) {
  return (
    <header className="mobile-page-header" aria-label={`${title} page header`}>
      <div className="mobile-page-header__inner">
        <Link
          className="mobile-page-header__back"
          href={backHref}
          aria-label={backLabel}
        >
          <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
        </Link>

        <div className="mobile-page-header__identity">
          {eyebrow && <p className="mobile-page-header__eyebrow">{eyebrow}</p>}
          <h1 className="mobile-page-header__title">{title}</h1>
        </div>

        {detail != null && (
          <span className="mobile-page-header__detail">{detail}</span>
        )}
      </div>
    </header>
  );
}
