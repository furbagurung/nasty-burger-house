"use client";

import { useEffect, useRef, useState } from "react";

type LottieAnimation = {
  destroy: () => void;
  goToAndStop: (value: number, isFrame: boolean) => void;
  addEventListener?: (event: string, handler: () => void) => void;
};

type LottieApi = {
  loadAnimation: (options: {
    container: HTMLElement;
    renderer: "svg";
    loop: boolean;
    autoplay: boolean;
    path: string;
    rendererSettings?: {
      preserveAspectRatio?: string;
    };
  }) => LottieAnimation;
};

declare global {
  interface Window {
    lottie?: LottieApi;
    __nastyBurgerLottiePromise?: Promise<LottieApi>;
  }
}

const LOTTIE_SCRIPT =
  "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js";

function loadLottie() {
  if (window.lottie) return Promise.resolve(window.lottie);
  if (window.__nastyBurgerLottiePromise) {
    return window.__nastyBurgerLottiePromise;
  }

  window.__nastyBurgerLottiePromise = new Promise<LottieApi>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(
      'script[data-nbh-lottie="true"]',
    );

    const resolvePlayer = () => {
      if (window.lottie) {
        resolve(window.lottie);
      } else {
        reject(new Error("Lottie player loaded without a global API."));
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.src = LOTTIE_SCRIPT;
      script.async = true;
      script.dataset.nbhLottie = "true";
      document.head.appendChild(script);
    }

    if (window.lottie) {
      resolvePlayer();
      return;
    }

    script.addEventListener("load", resolvePlayer, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Unable to load Lottie player.")),
      { once: true },
    );
  });

  return window.__nastyBurgerLottiePromise;
}

type LottieCoinProps = {
  className?: string;
};

export default function LottieCoin({ className = "" }: LottieCoinProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let animation: LottieAnimation | undefined;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    loadLottie()
      .then((lottie) => {
        if (!active || !containerRef.current) return;

        animation = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop: !reducedMotion,
          autoplay: !reducedMotion,
          path: "/images/drip-points/coin.json",
          rendererSettings: {
            preserveAspectRatio: "xMidYMid meet",
          },
        });

        animation.addEventListener?.("data_failed", () => {
          if (active) setFailed(true);
        });

        if (reducedMotion) {
          animation.goToAndStop(0, true);
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      animation?.destroy();
    };
  }, []);

  if (failed) {
    return (
      <img
        className={className}
        src="/images/drip-points/drip-coin.png"
        alt=""
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      ref={containerRef}
      className={["lottie-coin", className].filter(Boolean).join(" ")}
      style={{ display: "block", width: "100%", height: "100%" }}
      aria-hidden="true"
    />
  );
}
