"use client";

import { useEffect } from "react";

const HOME_MENU_PLACEHOLDER = "/images/home-menu/placeholder.svg";

const homeMenuCategories = [
  {
    href: "/product/bbq-beast",
    title: "Beast of the Month",
    image: HOME_MENU_PLACEHOLDER,
  },
  {
    href: "/menu/burgers",
    title: "Beast Burgers",
    image: HOME_MENU_PLACEHOLDER,
  },
  {
    href: "/menu/kids",
    title: "Kids",
    image: HOME_MENU_PLACEHOLDER,
  },
  {
    href: "/menu/sweet",
    title: "Desserts",
    image: HOME_MENU_PLACEHOLDER,
  },
  {
    href: "/menu/drinks",
    title: "Nasty Drinks",
    image: HOME_MENU_PLACEHOLDER,
  },
] as const;

function enhanceMenuGrid() {
  const grid = document.querySelector<HTMLElement>(".menu-preview__grid");
  if (!grid) return;

  const cards = Array.from(
    grid.querySelectorAll<HTMLAnchorElement>(":scope > a.menu-preview-card"),
  );

  homeMenuCategories.forEach((category, index) => {
    const card = cards[index];
    if (!card) return;

    card.setAttribute("href", category.href);
    card.className = "menu-preview-card menu-preview-card--clean";
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
      media.appendChild(image);
      media.dataset.image = category.image;
    }

    let title = card.querySelector<HTMLElement>(":scope > strong");
    if (!title) {
      title = document.createElement("strong");
      card.appendChild(title);
    }
    title.textContent = category.title;
  });
}

export default function HomeMenuCategoriesEnhancer() {
  useEffect(() => {
    enhanceMenuGrid();

    const grid = document.querySelector<HTMLElement>(".menu-preview__grid");
    if (!grid) return;

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(enhanceMenuGrid);
    });

    observer.observe(grid, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <style>{`
      .menu-preview {
        padding: clamp(5rem, 8vw, 7.5rem) max(1.25rem, calc((100% - 1180px) / 2)) !important;
        background: #ffffff !important;
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
        background: #ffffff;
        color: #15130f;
      }

      .menu-preview__heading .outline-button:hover {
        border-color: #15130f;
        background: #ffffff;
        color: #15130f;
      }

      .menu-preview__grid {
        display: grid !important;
        width: min(100%, 1180px);
        grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
        align-items: end;
        gap: clamp(1.25rem, 2.6vw, 2.5rem) !important;
        margin: clamp(4rem, 6.5vw, 5.75rem) auto 0 !important;
      }

      .menu-preview-card--clean {
        position: relative;
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
        height: clamp(9.5rem, 13.5vw, 12.25rem);
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: transparent;
      }

      .menu-preview-card__image img {
        position: relative !important;
        inset: auto !important;
        display: block;
        width: 100% !important;
        height: 100% !important;
        padding: 0 !important;
        object-fit: contain !important;
        object-position: center !important;
      }

      .menu-preview-card--clean strong {
        position: static !important;
        z-index: auto !important;
        display: block;
        max-width: 13rem !important;
        margin-top: 1.25rem;
        color: #15130f !important;
        font-size: clamp(1rem, 1.3vw, 1.2rem) !important;
        font-weight: 500 !important;
        letter-spacing: -0.02em !important;
        line-height: 1.3 !important;
        text-align: center;
      }

      .menu-preview-card--clean:focus-visible {
        border-radius: 0.5rem;
        outline-color: #e83b18;
      }

      @media (max-width: 980px) {
        .menu-preview__grid {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          row-gap: 3.75rem !important;
        }

        .menu-preview-card__image {
          height: 11rem;
        }
      }

      @media (max-width: 680px) {
        .menu-preview {
          padding: 4.25rem 1rem 4.75rem !important;
        }

        .menu-preview__heading h2 {
          font-size: clamp(2.75rem, 12vw, 4rem) !important;
        }

        .menu-preview__heading .outline-button {
          margin-top: 1.5rem;
        }

        .menu-preview__grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 2.75rem 1rem !important;
          margin-top: 3.5rem !important;
        }

        .menu-preview-card--clean:first-child {
          grid-column: auto !important;
          min-height: 0 !important;
        }

        .menu-preview-card__image {
          height: 8.75rem;
        }

        .menu-preview-card--clean strong {
          margin-top: 0.8rem;
          font-size: 0.95rem !important;
        }
      }
    `}</style>
  );
}
