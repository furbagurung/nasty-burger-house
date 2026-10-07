import Image from "next/image";

const DESKTOP_AD = "/images/hero-slider/hero-2-loyalty-drip-points.jpg";
const MOBILE_AD = "/images/loyalty-poster.png";

export default function DripPointsBanner() {
  return (
    <section
      className="drip-ad-display"
      aria-label="Nasty Burger House promotion"
    >
      <div className="drip-ad-display__desktop">
        <Image
          src={DESKTOP_AD}
          alt="Nasty Burger House Drip Points promotion"
          fill
          sizes="(max-width: 1180px) calc(100vw - 2rem), 1180px"
          className="drip-ad-display__image"
        />
      </div>

      <div className="drip-ad-display__mobile">
        <Image
          src={MOBILE_AD}
          alt="Nasty Burger House Drip Points promotion"
          fill
          sizes="calc(100vw - 1.5rem)"
          className="drip-ad-display__image"
        />
      </div>
    </section>
  );
}
