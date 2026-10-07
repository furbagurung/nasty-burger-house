import Image from "next/image";
import ButtonWithIcon from "@/components/ui/button-witn-icon";

export default function DripPointsBanner() {
  return (
    <div className="drip-points-banner-host">
      <section className="drip-points-banner" aria-labelledby="drip-banner-title">
        <div className="drip-points-banner__inner">
          <div className="drip-points-banner__copy">
            <h2 id="drip-banner-title">
              Join the loyalty. Get 500 Drip Points.
            </h2>
            <div className="drip-points-banner__meta" aria-label="Drip Points benefits">
              <span>500 points to start</span>
              <span>Earn every order</span>
            </div>
            <ButtonWithIcon href="/drip-points" tone="red">
              Join Drip Points
            </ButtonWithIcon>
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
      </section>
    </div>
  );
}
