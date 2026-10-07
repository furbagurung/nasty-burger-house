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
        padding: clamp(4rem, 7vw, 6rem) max(1.25rem, calc((100% - 1180px) / 2)) !important;
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
        font-weight: 400 !important;
        line-height: 0.94 !important;
      }

      .menu-preview__heading .outline-button {
        margin-top: 1.4rem;
        border-color: #77716a;
        background: #fff;
        color: #15130f;
      }

      .menu-preview__grid {
        display: grid !important;
        width: min(100%, 1180px);
        grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
        align-items: start;
        gap: 1rem !important;
        margin: clamp(2.25rem, 4vw, 3.5rem) auto 0 !important;
      }

      .menu-preview-card--clean {
        display: grid;
        min-width: 0;
        gap: 0.8rem;
        overflow: visible !important;
        border: 0 !important;
        border-radius: 0 !important;
        padding: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        color: #15130f !important;
        text-align: left;
        text-decoration: none;
        transform: none !important;
      }

      .menu-preview-card--clean::before {
        display: none !important;
        content: none !important;
      }

      .menu-preview-card__image {
        position: relative;
        display: block;
        width: 100%;
        aspect-ratio: 1 / 1;
        overflow: hidden;
        border-radius: 1.15rem;
        background: #f4eee4;
      }

      .menu-preview-card__image img:not(.home-menu-card__sticker) {
        display: block;
        width: 100% !important;
        height: 100% !important;
        padding: 0.45rem;
        object-fit: contain !important;
        object-position: center !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -webkit-user-drag: none !important;
        pointer-events: none;
        transition: transform 220ms ease;
      }

      .menu-preview-card--clean:hover .menu-preview-card__image img:not(.home-menu-card__sticker) {
        transform: scale(1.025);
      }

      .menu-preview-card--clean.is-disabled {
        opacity: 1;
        filter: none;
        cursor: default;
      }

      .menu-preview-card--clean.is-disabled > * {
        pointer-events: none;
      }

      .home-menu-card__sticker {
        position: absolute;
        top: 0.65rem;
        right: 0.65rem;
        z-index: 3;
        width: clamp(4.25rem, 7vw, 6rem);
        height: auto;
        object-fit: contain;
        pointer-events: none;
      }

      .menu-preview-card--clean strong {
        position: static !important;
        display: block;
        max-width: 100% !important;
        margin: 0;
        overflow: hidden;
        color: #15130f !important;
        font-family: var(--font-dm-sans), Arial, Helvetica, sans-serif !important;
        font-size: 0.98rem !important;
        font-weight: 850 !important;
        line-height: 1.15 !important;
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      @media (max-width: 980px) {
        .menu-preview__grid {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }
      }

      @media (max-width: 680px) {
        .menu-preview {
          overflow: hidden !important;
          padding: 1rem 0 2rem !important;
        }

        .menu-preview__heading {
          align-items: flex-start !important;
          padding: 0 1rem;
          text-align: left !important;
        }

        .menu-preview__grid {
          display: grid !important;
          width: 100% !important;
          grid-auto-columns: minmax(9.15rem, 41vw);
          grid-auto-flow: column;
          grid-template-columns: none !important;
          gap: 0.8rem !important;
          margin: 0.85rem 0 0 !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          padding: 0 1rem 0.65rem !important;
          overscroll-behavior-inline: contain;
          scroll-padding-inline: 1rem;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          touch-action: pan-x;
          -webkit-overflow-scrolling: touch;
          user-select: none;
          -webkit-user-select: none;
        }

        .menu-preview__grid::-webkit-scrollbar {
          display: none;
        }

        .menu-preview__grid.is-dragging,
        .menu-preview__grid.is-overdragging,
        .menu-preview__grid.is-springing {
          cursor: grabbing;
        }

        .menu-preview-card--clean,
        .menu-preview-card--clean:first-child {
          display: grid !important;
          width: auto !important;
          min-width: 0 !important;
          scroll-snap-align: start;
          scroll-snap-stop: always;
        }

        .menu-preview-card__image {
          border-radius: 0.95rem;
          background: #f7f3ed;
        }

        .menu-preview-card__image img:not(.home-menu-card__sticker) {
          padding: 0.3rem;
        }

        .home-menu-card__sticker {
          top: 0.4rem;
          right: 0.4rem;
          width: clamp(3.5rem, 18vw, 5rem);
        }

        .menu-preview-card--clean strong {
          font-size: 0.82rem !important;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .menu-preview-card__image img:not(.home-menu-card__sticker) {
          transition: none;
        }

        .menu-preview__grid {
          scroll-behavior: auto !important;
        }
      }
    `}</style>
  );
}
