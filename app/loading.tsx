import Image from "next/image";

export default function Loading() {
  return (
    <main className="nasty-loading" role="status" aria-live="polite" aria-label="Loading Nasty Burger House">
      <div className="nasty-loading__stage" aria-hidden="true">
        <span className="nasty-loading__orbit nasty-loading__orbit--outer" />
        <span className="nasty-loading__orbit nasty-loading__orbit--inner" />
        <div className="nasty-loading__logo-wrap">
          <Image
            className="nasty-loading__logo"
            src="/logo.webp"
            alt=""
            width={180}
            height={180}
            priority
          />
        </div>
      </div>

      <div className="nasty-loading__copy">
        <strong>Cooking something nasty</strong>
        <span>Fresh feed incoming.</span>
      </div>

      <div className="nasty-loading__bar" aria-hidden="true">
        <span />
      </div>
    </main>
  );
}
