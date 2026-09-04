"use client";

import { useEffect } from "react";

const homeMenuCategories = [
  {
    href: "/product/bbq-beast",
    title: "Beast of the Month",
    image: "/images/home-menu/beast-of-the-month.jpg",
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
    title: "Desserts",
    image: "/images/home-menu/desserts.jpg",
  },
  {
    href: "/menu/drinks",
    title: "Nasty Drinks",
    image: "/images/home-menu/nasty-drinks.jpg",
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

    card.href = category.href;
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
        display: flex;
        width: 100%;
        height: clamp(7.25rem, 10vw, 9.5rem);
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: transparent;
      }

      .menu-preview-card__image img {
        display: block;
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
        object-position: center !important;
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
          padding: 4.25rem 1rem 4.75rem !important;
        }

        .menu-preview__heading h2 {
          font-size: clamp(2.75rem, 12vw, 4rem) !important;
        }

        .menu-preview__grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 2rem 0.65rem !important;
          margin-top: 3.5rem !important;
        }

        .menu-preview-card--clean:first-child {
          grid-column: auto !important;
          min-height: 0 !important;
        }

        .menu-preview-card__image {
          height: 7.25rem;
        }

        .menu-preview-card--clean strong {
          margin-top: 0.65rem;
          font-size: 0.95rem !important;
        }
      }
    `}</style>
  );
}
