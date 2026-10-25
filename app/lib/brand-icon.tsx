import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Render the existing restaurant logo as a crisp PNG at the requested size.
// Google Search accepts PNG favicons larger than 48 × 48, unlike WebP.
export async function renderNastyBrandIcon(size: number) {
  const brandLogo = await readFile(join(process.cwd(), "public", "logo.webp"));
  const logoSource = `data:image/webp;base64,${brandLogo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: "#121212", // --nb-dark-canvas (DARK_THEME.md)
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* ImageResponse needs a native img, not next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSource}
          alt="Nasty Burger House"
          width={size}
          height={size}
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { width: size, height: size },
  );
}
