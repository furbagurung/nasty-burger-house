"use client";

import { useEffect } from "react";

const homeMenuCategories = [
  {
    id: "beast-of-the-month",
    title: "Beast of the Month",
    href: "/beast-of-the-month",
    image: "/images/home-menu/beast-of-the-month.jpg",
    disabled: true,
    sticker: "/images/coming-soon.png",
  },
  {
    href: "/menu/burgers",
    title: "Beast Burgers",
    image: "/images/home-menu/beast-burgers.jpg",
  },
  {
    href: "/menu/kids",
    title: "Kids",
    image: "/images/home-menu/kids.jpg",
  },
  {
    href: "/menu/sweet",
    title: "Dessert",
    image: "/images/home-menu/desserts.jpg",
  },
  {
    href: "/menu/drinks",
    title: "Drinks",
    image: "/images/home-menu/drinks.webp",
  },
] as const;

function enhanceMenuGrid() {
  const grid = document.querySelector<HTMLElement>(".menu-preview__grid");
  if (!grid) return;

  const viewMenu = document.querySelector<HTMLAnchorElement>(
    ".menu-preview__heading .outline-button",
  );
  if (viewMenu && viewMenu.textContent !== "View all menu") {
    viewMenu.textContent = "View all menu";
  }

  const cards = Array.from(
    grid.querySelectorAll<HTMLElement>(":scope > .menu-preview-card"),
  );

  homeMenuCategories.forEach((category, index) => {
    const card = cards[index];
    if (!card) return;

    if (card instanceof HTMLAnchorElement) card.href = category.href;
    card.className = "menu-preview-card menu-preview-card--clean";
    const disabled = "disabled" in category && category.disabled;
    card.classList.toggle("is-disabled", disabled);
    if (disabled) card.setAttribute("aria-disabled", "true");
    else card.removeAttribute("aria-disabled");
    card.setAttribute("aria-label", category.title);
    card.querySelectorAll(":scope > span").forEach((node) => node.remove());

    let media = card.querySelector<HTMLDivElement>(
      ":scope > .menu-preview-card__image",
    );

    if (!media) {
      media = document.createElement("div");
      card.prepend(media);
    }

    media.className = "menu-preview-card__image";

    if (media.dataset.image !== category.image) {
      media.replaceChildren();
      const image = document.createElement("img");
      image.src = category.image;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      image.draggable = false;
      media.appendChild(image);
      media.dataset.image = category.image;
    } else {
      const image = media.querySelector<HTMLImageElement>("img");
      if (image) image.draggable = false;
    }

    if ("sticker" in category && !media.querySelector(".home-menu-card__sticker")) {
      const sticker = document.createElement("img");
      sticker.src = category.sticker;
      sticker.alt = "Coming soon";
      sticker.className = "home-menu-card__sticker";
      sticker.draggable = false;
      media.appendChild(sticker);
    }

    let title = card.querySelector<HTMLElement>(":scope > strong");
    if (!title) {
      title = document.createElement("strong");
      card.appendChild(title);
    }

    if (title.textContent !== category.title) title.textContent = category.title;
  });
}

function bindResponsiveDrag(grid: HTMLElement) {
  const mobileQuery = window.matchMedia("(max-width: 680px)");
  const overdragThreshold = 34;

  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let dragging = false;
  let suppressClick = false;
  let overdragOffset = 0;
  let maxRawOverdrag = 0;
  let animationFrame = 0;

  const setOverdrag = (value: number) => {
    overdragOffset = value;
    grid.style.setProperty("--menu-overdrag-offset", `${value}px`);
    grid.classList.toggle("is-overdragging", Math.abs(value) > 0.2);
  };

  const stopBounce = () => {
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
    grid.classList.remove("is-springing");
  };

  const springOverdragBack = () => {
    stopBounce();
    grid.classList.add("is-springing");

    let position = overdragOffset;
    let springVelocity = 0;

    const tick = () => {
      const distance = -position;
      springVelocity = (springVelocity + distance * 0.16) * 0.74;
      position += springVelocity;
      setOverdrag(position);

      if (Math.abs(position) < 0.35 && Math.abs(springVelocity) < 0.3) {
        setOverdrag(0);
        grid.classList.remove("is-springing");
        animationFrame = 0;
        return;
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
  };

  const finishDrag = () => {
    if (pointerId === null) return;

    if (dragging) {
      if (
        maxRawOverdrag >= overdragThreshold &&
        Math.abs(overdragOffset) > 0.2
      ) {
        springOverdragBack();
      } else {
        setOverdrag(0);
      }

      suppressClick = true;
      window.setTimeout(() => {
        suppressClick = false;
      }, 160);
    }

    grid.classList.remove("is-dragging");
    pointerId = null;
    dragging = false;
    maxRawOverdrag = 0;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!mobileQuery.matches || !event.isPrimary) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    stopBounce();
    setOverdrag(0);
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startScrollLeft = grid.scrollLeft;
    dragging = false;
    maxRawOverdrag = 0;
  };

  const onPointerMove = (event: PointerEvent) => {
    if (pointerId !== event.pointerId || !mobileQuery.matches) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    if (!dragging) {
      if (Math.abs(dx) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        pointerId = null;
        return;
      }

      dragging = true;
      grid.classList.add("is-dragging");
      grid.setPointerCapture(event.pointerId);
    }

    event.preventDefault();

    const maxScroll = Math.max(0, grid.scrollWidth - grid.clientWidth);
    const rawTarget = startScrollLeft - dx;

    if (rawTarget < 0) {
      const rawOverdrag = Math.abs(rawTarget);
      maxRawOverdrag = Math.max(maxRawOverdrag, rawOverdrag);
      grid.scrollLeft = 0;
      setOverdrag(Math.min(28, rawOverdrag * 0.22));
      return;
    }

    if (rawTarget > maxScroll) {
      const rawOverdrag = rawTarget - maxScroll;
      maxRawOverdrag = Math.max(maxRawOverdrag, rawOverdrag);
      grid.scrollLeft = maxScroll;
      setOverdrag(-Math.min(28, rawOverdrag * 0.22));
      return;
    }

    setOverdrag(0);
    grid.scrollLeft = rawTarget;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return;
    if (grid.hasPointerCapture(event.pointerId)) {
      grid.releasePointerCapture(event.pointerId);
    }
    finishDrag();
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return;
    finishDrag();
  };

  const onDragStart = (event: DragEvent) => {
    event.preventDefault();
  };

  const onClickCapture = (event: MouseEvent) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
  };

  grid.addEventListener("pointerdown", onPointerDown);
  grid.addEventListener("pointermove", onPointerMove);
  grid.addEventListener("pointerup", onPointerUp);
  grid.addEventListener("pointercancel", onPointerCancel);
  grid.addEventListener("dragstart", onDragStart);
  grid.addEventListener("click", onClickCapture, true);

  return () => {
    stopBounce();
    setOverdrag(0);
    grid.style.removeProperty("--menu-overdrag-offset");
    grid.removeEventListener("pointerdown", onPointerDown);
    grid.removeEventListener("pointermove", onPointerMove);
    grid.removeEventListener("pointerup", onPointerUp);
    grid.removeEventListener("pointercancel", onPointerCancel);
    grid.removeEventListener("dragstart", onDragStart);
    grid.removeEventListener("click", onClickCapture, true);
  };
}

export default function HomeMenuCategoriesEnhancer() {
  useEffect(() => {
    enhanceMenuGrid();

    const grid = document.querySelector<HTMLElement>(".menu-preview__grid");
    if (!grid) return;

    const unbindDrag = bindResponsiveDrag(grid);
    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(enhanceMenuGrid);
    });

    observer.observe(grid, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      unbindDrag();
    };
  }, []);

  return (
    <style>{`
      .menu-preview {
        padding: clamp(5rem, 8vw, 7.5rem) max(1.25rem, calc((100% - 1180px) / 2)) !important;
        background: #fff !important;
        color: #15130f;
      }

      .menu-preview__heading {
        display: flex;
        align-items: center;
        flex-direction: column;
        text-align: center;
      }

      .menu-preview__heading .eyebrow {
        margin-bottom: 0.75rem;
      }

      .menu-preview__heading h2 {
        margin: 0;
        color: #15130f;
        font-size: clamp(3.2rem, 5.8vw, 5.5rem) !important;
        font-weight: 950 !important;
        letter-spacing: -0.065em !important;
        line-height: 0.94 !important;
      }

      .menu-preview__heading .outline-button {
        margin-top: 2rem;
        border-color: #77716a;
        background: #fff;
        color: #15130f;
      }

      .menu-preview__grid {
        display: grid !important;
        width: min(100%, 1120px);
        grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
        align-items: end;
        gap: clamp(0.5rem, 1vw, 1rem) !important;
        margin: clamp(4rem, 6.5vw, 5.75rem) auto 0 !important;
      }

      .menu-preview-card--clean {
        display: flex;
        min-width: 0;
        min-height: 0 !important;
        align-items: center;
        justify-content: flex-start !important;
        flex-direction: column;
        overflow: visible !important;
        border: 0 !important;
        border-radius: 0 !important;
        padding: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        color: #15130f !important;
        text-align: center;
        text-decoration: none;
        transform: none !important;
        transition: none !important;
      }

      .menu-preview-card--clean::before {
        display: none !important;
        content: none !important;
      }

      .menu-preview-card--clean:hover,
      .menu-preview-card--clean:active {
        background: transparent !important;
        box-shadow: none !important;
        transform: none !important;
      }

      .menu-preview-card__image {
        position: relative;
        display: flex;
        width: 100%;
        height: clamp(7.25rem, 10vw, 9.5rem);
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: transparent;
      }

      .menu-preview-card__image img:not(.home-menu-card__sticker) {
        display: block;
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
        object-position: center !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -webkit-user-drag: none !important;
        pointer-events: none;
      }

      .menu-preview-card--clean.is-disabled {
        opacity: 0.5;
        filter: grayscale(0.15);
        cursor: not-allowed;
      }

      .menu-preview-card--clean.is-disabled > * {
        pointer-events: none;
      }

      .home-menu-card__sticker {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        width: 5.5rem;
        height: auto;
        z-index: 3;
        object-fit: contain;
        pointer-events: none;
      }

      @media (max-width: 768px) {
        .home-menu-card__sticker {
          width: 4.25rem;
          top: 0.5rem;
          right: 0.5rem;
        }
      }

      .menu-preview-card--clean strong {
        position: static !important;
        display: block;
        max-width: 13rem !important;
        margin-top: 0.9rem;
        color: #15130f !important;
        font-size: clamp(1rem, 1.3vw, 1.2rem) !important;
        font-weight: 500 !important;
        letter-spacing: -0.02em !important;
        line-height: 1.3 !important;
        text-align: center;
      }

      @media (max-width: 980px) {
        .menu-preview__grid {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          row-gap: 2.25rem !important;
        }

        .menu-preview-card__image {
          height: 8.5rem;
        }
      }

      @media (max-width: 680px) {
        .menu-preview {
          overflow: hidden !important;
          padding: 2.65rem 0 3.1rem !important;
        }

        .menu-preview__heading {
          align-items: flex-start !important;
          padding: 0 1rem;
          text-align: left !important;
        }

        .menu-preview__heading .eyebrow {
          margin-bottom: 0.35rem;
          font-size: 0.62rem;
        }

        .menu-preview__heading h2 {
          font-size: clamp(2rem, 9vw, 2.65rem) !important;
          letter-spacing: -0.055em !important;
        }

        .menu-preview__heading .outline-button {
          min-height: 2.45rem;
          margin-top: 0.85rem;
          padding: 0.55rem 0.95rem;
          font-size: 0.76rem;
        }

        .menu-preview__grid {
          display: flex !important;
          width: 100% !important;
          grid-template-columns: none !important;
          align-items: flex-start;
          gap: 0.45rem !important;
          margin: 1.55rem 0 0 !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          padding: 0 1rem 0.5rem !important;
          cursor: grab;
          touch-action: pan-y pinch-zoom;
          scroll-padding-inline: 1rem;
          scroll-snap-type: x mandatory;
          overscroll-behavior-x: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          user-select: none;
          -webkit-user-select: none;
        }

        .menu-preview__grid.is-dragging {
          scroll-snap-type: none !important;
          scroll-behavior: auto !important;
          cursor: grabbing;
        }

        .menu-preview__grid.is-overdragging .menu-preview-card--clean,
        .menu-preview__grid.is-springing .menu-preview-card--clean {
          transform: translate3d(var(--menu-overdrag-offset, 0px), 0, 0) !important;
        }

        .menu-preview__grid::-webkit-scrollbar {
          display: none;
        }

        .menu-preview-card--clean,
        .menu-preview-card--clean:first-child {
          width: clamp(6.35rem, 27vw, 7.5rem) !important;
          min-width: clamp(6.35rem, 27vw, 7.5rem) !important;
          flex: 0 0 clamp(6.35rem, 27vw, 7.5rem) !important;
          grid-column: auto !important;
          min-height: 0 !important;
          scroll-snap-align: start;
          scroll-snap-stop: always;
        }

        .menu-preview-card__image {
          width: 100%;
          height: clamp(5.4rem, 23vw, 6.4rem);
        }

        .menu-preview-card--clean strong {
          max-width: 7.5rem !important;
          margin-top: 0.38rem;
          font-size: clamp(0.7rem, 3vw, 0.8rem) !important;
          font-weight: 650 !important;
          line-height: 1.2 !important;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .menu-preview__grid {
          scroll-behavior: auto !important;
        }
      }
    `}</style>
  );
}
