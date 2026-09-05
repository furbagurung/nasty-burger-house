import type { SVGProps } from "react";

type SocialIconName = "instagram" | "facebook" | "tiktok";

type SocialIconProps = SVGProps<SVGSVGElement> & {
  name: SocialIconName;
};

export default function SocialIcon({ name, ...props }: SocialIconProps) {
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name === "facebook") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M13.7 21v-8h2.8l.42-3.18H13.7V7.79c0-.92.26-1.55 1.62-1.55H17V3.4c-.29-.04-1.29-.12-2.45-.12-2.42 0-4.08 1.47-4.08 4.18v2.36H7.75V13h2.72v8h3.23Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14.55 3c.38 2.25 1.66 3.59 3.82 4.03v2.7a7.2 7.2 0 0 1-3.8-1.05v5.6a6.1 6.1 0 1 1-5.26-6.05v2.78a3.38 3.38 0 1 0 2.48 3.26V3h2.76Z" />
    </svg>
  );
}
