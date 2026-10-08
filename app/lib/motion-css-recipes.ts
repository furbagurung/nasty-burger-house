// Migrated CSS keyframes and selectors. Motion owns their playback.
export const cssMotionRecipes = {
  "accountModalFade": [
    {
      "offset": 0,
      "values": {
        "opacity": "0"
      }
    },
    {
      "offset": 1,
      "values": {
        "opacity": "1"
      }
    }
  ],
  "accountModalRise": [
    {
      "offset": 0,
      "values": {
        "opacity": "0",
        "transform": "translateY(14px) scale(0.98)"
      }
    },
    {
      "offset": 1,
      "values": {
        "opacity": "1",
        "transform": "translateY(0) scale(1)"
      }
    }
  ],
  "accountSkeletonSweep": [
    {
      "offset": 1,
      "values": {
        "transform": "translateX(100%)"
      }
    }
  ],
  "nbh-admin-new-order-pulse": [
    {
      "offset": 0,
      "values": {
        "opacity": "1"
      }
    },
    {
      "offset": 0.5,
      "values": {
        "opacity": "0.66"
      }
    },
    {
      "offset": 1,
      "values": {
        "opacity": "1"
      }
    }
  ],
  "nbh-cart-backdrop-in": [
    {
      "offset": 0,
      "values": {
        "background": "rgba(0, 0, 0, 0)"
      }
    },
    {
      "offset": 1,
      "values": {
        "background": "rgba(0, 0, 0, 0.34)"
      }
    }
  ],
  "nbh-cart-drawer-in": [
    {
      "offset": 0,
      "values": {
        "opacity": "0.72",
        "transform": "translateX(100%)"
      }
    },
    {
      "offset": 1,
      "values": {
        "opacity": "1",
        "transform": "translateX(0)"
      }
    }
  ],
  "nasty-coming-soon-float": [
    {
      "offset": 0,
      "values": {
        "transform": "translate3d(0, 4px, 0)"
      }
    },
    {
      "offset": 1,
      "values": {
        "transform": "translate3d(0, -7px, 0)"
      }
    }
  ],
  "closure-marquee-bounce": [
    {
      "offset": 0,
      "values": {
        "transform": "translateX(0)"
      }
    },
    {
      "offset": 0.08,
      "values": {
        "transform": "translateX(0)"
      }
    },
    {
      "offset": 0.92,
      "values": {
        "transform": "translateX(-50%)"
      }
    },
    {
      "offset": 1,
      "values": {
        "transform": "translateX(-50%)"
      }
    }
  ],
  "landing-promo-enter": [
    {
      "offset": 0,
      "values": {
        "opacity": "0",
        "transform": "translateY(0.75rem) scale(0.975)"
      }
    },
    {
      "offset": 1,
      "values": {
        "opacity": "1",
        "transform": "translateY(0) scale(1)"
      }
    }
  ],
  "nasty-loading-spin": [
    {
      "offset": 1,
      "values": {
        "transform": "rotate(360deg)"
      }
    }
  ],
  "nasty-loading-spin-reverse": [
    {
      "offset": 1,
      "values": {
        "transform": "rotate(-360deg)"
      }
    }
  ],
  "nasty-loading-pulse": [
    {
      "offset": 0,
      "values": {
        "transform": "scale(0.96)"
      }
    },
    {
      "offset": 0.5,
      "values": {
        "transform": "scale(1.035)"
      }
    },
    {
      "offset": 1,
      "values": {
        "transform": "scale(0.96)"
      }
    }
  ],
  "nasty-loading-bar": [
    {
      "offset": 0,
      "values": {
        "left": "-45%"
      }
    },
    {
      "offset": 0.58,
      "values": {
        "left": "100%"
      }
    },
    {
      "offset": 1,
      "values": {
        "left": "100%"
      }
    }
  ],
  "mobile-drawer-in": [
    {
      "offset": 0,
      "values": {
        "transform": "translateX(-100%)"
      }
    },
    {
      "offset": 1,
      "values": {
        "transform": "translateX(0)"
      }
    }
  ],
  "product-drawer-slide": [
    {
      "offset": 0,
      "values": {
        "transform": "translateX(100%)"
      }
    },
    {
      "offset": 1,
      "values": {
        "transform": "translateX(0)"
      }
    }
  ],
  "product-drawer-fade": [
    {
      "offset": 0,
      "values": {
        "opacity": "0"
      }
    },
    {
      "offset": 1,
      "values": {
        "opacity": "1"
      }
    }
  ],
  "nasty-toast-enter": [
    {
      "offset": 0,
      "values": {
        "opacity": "0",
        "transform": "translate3d(1.2rem, -0.2rem, 0) scale(0.985)"
      }
    },
    {
      "offset": 1,
      "values": {
        "opacity": "1",
        "transform": "translate3d(0, 0, 0) scale(1)"
      }
    }
  ],
  "nasty-toast-progress": [
    {
      "offset": 0,
      "values": {
        "transform": "scaleX(1)"
      }
    },
    {
      "offset": 1,
      "values": {
        "transform": "scaleX(0)"
      }
    }
  ],
  "nasty-toast-enter-mobile": [
    {
      "offset": 0,
      "values": {
        "opacity": "0",
        "transform": "translate3d(0, 0.8rem, 0) scale(0.985)"
      }
    },
    {
      "offset": 1,
      "values": {
        "opacity": "1",
        "transform": "translate3d(0, 0, 0) scale(1)"
      }
    }
  ]
} as const;
export const cssMotionSelectors = [
  ".home-top-header__account-dropdown > .home-top-header__drip-entry",
  ".home-top-header__account-links > a",
  ".home-top-header__account-dropdown > .home-top-header__signout",
  ".account-saas-nav a",
  ".account-loyalty-modal-backdrop",
  ".account-loyalty-modal",
  ".account-skeleton-block",
  ".account-skeleton-coin",
  ".account-skeleton-star",
  ".admin-new-order-badge",
  ".hero-carousel .hero-slide__copy .hero-card__cta",
  ".outline-button",
  ".primary-button",
  ".secondary-button",
  ".standalone-primary-button",
  ".catalogue-order-button",
  ".cart-redesign-checkout",
  ".cart-redesign-add-more",
  ".product-add-button",
  ".account-saas-order-button",
  ".drip-points-banner__cta",
  ".home-testimonials__cta",
  ".home-feature__copy > button",
  ".checkout-summary > button",
  ".drawer-backdrop:has(.cart-drawer)",
  ".drawer-backdrop .cart-drawer",
  ".cart-redesign-back",
  ".cart-redesign-item__media img",
  ".cart-redesign-remove",
  ".catalogue-product",
  ".home-top-header__dropdown-icon",
  ".menu-preview-card--clean.is-disabled .home-menu-card__sticker",
  ".closure-announcement",
  ".closure-announcement.is-header-hidden",
  ".closure-announcement__marquee",
  ".drip-page .drip-dashboard-earn__copy > a span",
  ".site-shell > .site-header",
  ".site-shell > .site-header .mobile-menu-button span",
  ".nasty-find-burger",
  ".nasty-find-burger > span",
  ".nasty-find-burger[aria-expanded=\"true\"] > span",
  ".nasty-find-drawer",
  ".nasty-find-drawer.is-open",
  ".nasty-find-drawer__surface",
  ".nasty-find-drawer__link",
  ".nasty-find-drawer__actions",
  ".nasty-find-drawer.is-open .nasty-find-drawer__link",
  ".nasty-find-drawer.is-open .nasty-find-drawer__actions",
  ".nasty-find-drawer__arrow",
  ".nasty-find-drawer.is-open .nasty-find-drawer__menu-trigger",
  ".nasty-find-drawer__plus i",
  ".nasty-find-drawer__submenu",
  ".nasty-find-drawer__submenu a",
  ".find-us-section__copy > a",
  ".site-footer a",
  ".site-footer button",
  ".site-footer nav span",
  ".footer-social-links > a",
  ".brand-logo--header",
  ".hero-slide",
  ".hero-slide__image",
  ".hero-carousel__dots button",
  ".desktop-nav a",
  ".desktop-nav .nav-button",
  ".menu-preview-card",
  ".hero-card__cta",
  ".account-google-button",
  ".mobile-hero-motion-controls > button",
  ".mobile-hero-motion-dots button",
  ".hero-slide__copy .hero-card__cta",
  ".home-promo-card__copy > a",
  ".home-promo-card__copy > a span",
  ".menu-preview-card--clean",
  ".home-top-header",
  ".home-top-header__brand img",
  ".home-top-header__nav a",
  ".home-top-header__nav button",
  ".home-top-header__account",
  ".home-top-header__cart",
  ".home-top-header__account-dropdown > a",
  ".home-top-header__account-dropdown > button",
  ".popular-pick-card__media img",
  ".popular-picks__heading > a",
  ".popular-pick-card__media",
  ".popular-pick-card__add",
  ".popular-pick-card",
  ".home-testimonials__indicators button",
  ".home-testimonials__track",
  ".landing-promo-modal__dialog",
  ".nasty-loading__logo-wrap",
  ".nasty-loading__orbit--outer",
  ".nasty-loading__orbit--inner",
  ".nasty-loading__bar > span",
  ".nasty-loading__orbit",
  ".catalogue-product--browse",
  ".catalogue-shell:not(.product-page-shell) .catalogue-categories a",
  ".catalogue-shell.menu-catalogue-shell > .catalogue-header",
  ".catalogue-shell.menu-catalogue-shell .catalogue-categories a",
  ".catalogue-shell.menu-catalogue-shell > .mobile-tab-bar",
  ".catalogue-shell:not(.product-page-shell) > .catalogue-header",
  ".mobile-nav-drawer",
  ".catalogue-nav-drawer",
  ".mobile-tab-bar--v2",
  ".mobile-home-location",
  ".mobile-hero-motion-controls *",
  ".mobile-tab__order-circle",
  ".mobile-tab__order-bag",
  ".product-extras-trigger",
  ".product-extras-trigger__copy small",
  ".product-extras-trigger__summary small",
  ".product-extras-trigger__arrow",
  ".product-drink-drawer-backdrop",
  ".product-drink-drawer",
  ".product-drink-drawer__option",
  ".product-extra-drawer__option",
  ".product-page-premium .product-choice-card",
  ".product-page-premium .product-choice-card__bag",
  ".product-ingredient-drawer__option",
  ".product-page-shell > .catalogue-header",
  ".nasty-toast",
  ".nasty-toast__action",
  ".nasty-toast__close",
  ".nasty-toast__progress"
];
export const pseudoMotionProperties = [
  "opacity",
  "transform",
  "translate",
  "rotate",
  "scale",
  "color",
  "background-color",
  "background",
  "border-color",
  "box-shadow",
  "filter",
  "width",
  "height",
  "max-height",
  "padding",
  "padding-left",
  "padding-right",
  "padding-inline-start",
  "padding-inline-end",
  "margin",
  "margin-top",
  "left",
  "right",
  "top",
  "bottom",
  "visibility"
];

export const cssMotionPseudoSelectors = {
  "before": [
    ".nasty-find-burger",
    ".hero-carousel .hero-slide__copy .hero-card__cta"
  ],
  "after": [
    ".account-skeleton-block",
    ".account-skeleton-coin",
    ".account-skeleton-star",
    ".hero-carousel .hero-slide__copy .hero-card__cta",
    ".outline-button",
    ".primary-button",
    ".secondary-button",
    ".standalone-primary-button",
    ".catalogue-order-button",
    ".cart-redesign-checkout",
    ".cart-redesign-add-more",
    ".product-add-button",
    ".account-saas-order-button",
    ".drip-points-banner__cta",
    ".home-testimonials__cta",
    ".home-feature__copy > button",
    ".checkout-summary > button",
    ".desktop-nav a",
    ".desktop-nav .nav-button",
    ".home-top-header__nav a",
    ".home-top-header__nav button",
    ".product-page-premium .product-choice-card"
  ]
};
