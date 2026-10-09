"use client";

import Image from "next/image";
import { Globe2, Link2, MousePointer2 } from "lucide-react";
import { useState } from "react";

/**
 * The analytics API returns referrer hostnames, not necessarily valid URLs.
 * Reject anything that isn't a hostname before sending it to the favicon service.
 */
function trustedReferrerHost(source: string): string | null {
  const host = source.trim().toLowerCase();
  if (host.length > 253) return null;
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host)) {
    return null;
  }
  return host;
}

export function ReferrerFavicon({ source }: { source: string }) {
  const [failed, setFailed] = useState(false);
  const host = trustedReferrerHost(source);
  const isDirect = source.toLowerCase().includes("direct");

  return (
    <span className="admin-traffic-list-icon" aria-hidden="true">
      {host && !failed ? (
        <Image
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`}
          width={18}
          height={18}
          unoptimized
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : isDirect ? (
        <MousePointer2 size={15} />
      ) : (
        <Link2 size={15} />
      )}
    </span>
  );
}

export function CountryFlagIcon({ countryCode }: { countryCode: string }) {
  const [failed, setFailed] = useState(false);
  const code = countryCode.trim().toLowerCase();
  const validCode = /^[a-z]{2}$/.test(code) && code !== "xx";

  return (
    <span className="admin-traffic-list-icon admin-traffic-list-icon--flag" aria-hidden="true">
      {validCode && !failed ? (
        <Image
          src={`https://flagcdn.com/24x18/${code}.png`}
          width={24}
          height={18}
          unoptimized
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <Globe2 size={15} />
      )}
    </span>
  );
}
