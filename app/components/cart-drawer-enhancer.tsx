"use client";

import { useEffect } from "react";

const productImages: Record<string, string> = {
  "The OG Nasty": "/images/menu/og-nasty.jpg",
  "Peri Beast": "/images/menu/peri-beast.jpg",
  Hooked: "/images/menu/hooked.jpg",
  "Green Beast": "/images/menu/green-beast.jpg",
  "BBQ Beast": "/images/menu/BBQ-Beast.jpg",
  "Dirty Eggplant": "/images/menu/dirty-eggplant.jpg",
  "Buffalo Fury": "/images/menu/buffalo-fury.jpg",
  "Nasty Fries": "/images/menu/nasty-fries.jpg",
  "Monster Cheese": "/images/menu/monster-cheese.jpg",
  "Dino Nuggets": "/images/menu/Dino-nuggets.jpg",
  "Solo Beast Box": "/images/beast-boxes/Solo Beast Box.jpg",
  "Duo Beast Box": "/images/beast-boxes/Duo Beast Box.jpg",
  "Family Beast Box": "/images/beast-boxes/Family Beast Box.jpg",
  "Mango Pudding with Lychee Granita & Lychee Pearls":
    "/images/menu/mango-pudding.jpg",
  "Coca-Cola": "/images/menu/coke.webp",
  "Coke No Sugar": "/images/menu/coke no sugar.webp",
  Sprite: "/images/menu/sprite.jpg",
  Fanta: "/images/menu/fanta.webp",
  Lift: "/images/menu/lift.avif",
  Water: "/images/menu/water.jpg",
};

const SVG_NS = "http://www.w3.org/2000/svg";

function addActionIcon(button: HTMLButtonElement, type: "edit" | "remove") {
  if (button.dataset.cartIcon === type) return;

  button.textContent = "";
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");

  if (type === "edit") {
    const body = document.createElementNS(SVG_NS, "path");
    body.setAttribute(
      "d",
      "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
    );
    const detail = document.createElementNS(SVG_NS, "path");
    detail.setAttribute("d", "m15 5 4 4");
    svg.append(body, detail);
  } else {
    [
      "M10 11v6",
      "M14 11v6",
      "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
      "M3 6h18",
      "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    ].forEach((pathData) => {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", pathData);
      svg.appendChild(path);
    });
  }

  button.appendChild(svg);
  button.dataset.cartIcon = type;
}

function enhanceCartDrawer() {
  const drawer = document.querySelector<HTMLElement>(".cart-drawer");
  if (!drawer) return;

  drawer.classList.add("cart-drawer--mcd");

  const title = drawer.querySelector<HTMLElement>("#cart-title");
  if (title && title.textContent !== "My Bag") title.textContent = "My Bag";

  const cartLines = drawer.querySelector<HTMLElement>(".cart-lines");
  if (!cartLines) return;

  const lines = Array.from(
    cartLines.querySelectorAll<HTMLElement>(":scope > .cart-line"),
  );

  lines.forEach((line) => {
    line.classList.add("cart-line--mcd");
    const itemName = line.querySelector<HTMLElement>("h3")?.textContent?.trim();
    if (!itemName) return;

    let thumb = line.querySelector<HTMLDivElement>(
      ":scope > .cart-line__enhanced-thumb",
    );
    if (!thumb) {
      thumb = document.createElement("div");
      thumb.className = "cart-line__enhanced-thumb";
      const image = document.createElement("img");
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      thumb.appendChild(image);
      line.prepend(thumb);
    }

    const image = thumb.querySelector<HTMLImageElement>("img");
    const imageSrc = productImages[itemName] ?? "/images/bag.webp";
    if (image && image.getAttribute("src") !== imageSrc) image.src = imageSrc;

    const actions = line.querySelector<HTMLElement>(".cart-line__actions");
    if (actions) {
      const buttons = actions.querySelectorAll<HTMLButtonElement>("button");
      const editButton = buttons[0];
      const removeButton = buttons[1];
      if (editButton) {
        editButton.classList.add("cart-line__icon-action", "is-edit");
        editButton.setAttribute("aria-label", `Edit ${itemName}`);
        editButton.setAttribute("title", "Edit");
        addActionIcon(editButton, "edit");
      }
      if (removeButton) {
        removeButton.classList.add("cart-line__icon-action", "is-remove");
        removeButton.setAttribute("aria-label", `Remove ${itemName}`);
        removeButton.setAttribute("title", "Remove");
        addActionIcon(removeButton, "remove");
      }
    }

    const nativeQuantity = line.querySelector<HTMLElement>(":scope > .quantity-control");
    if (!nativeQuantity) return;
    nativeQuantity.classList.add("cart-line__native-quantity");

    const quantityText = nativeQuantity.querySelector("span")?.textContent ?? "1";
    const currentQuantity = Math.max(1, Number.parseInt(quantityText, 10) || 1);

    let quantityControl = line.querySelector<HTMLLabelElement>(
      ".cart-line__quantity-select",
    );
    if (!quantityControl) {
      quantityControl = document.createElement("label");
      quantityControl.className = "cart-line__quantity-select";
      quantityControl.setAttribute("aria-label", `Quantity for ${itemName}`);

      const select = document.createElement("select");
      select.setAttribute("aria-label", `Quantity for ${itemName}`);
      for (let quantity = 1; quantity <= 20; quantity += 1) {
        const option = document.createElement("option");
        option.value = String(quantity);
        option.textContent = String(quantity);
        select.appendChild(option);
      }
      select.addEventListener("change", () => {
        const targetQuantity = Number.parseInt(select.value, 10);
        const hiddenQuantity = line.querySelector<HTMLElement>(
          ":scope > .quantity-control",
        );
        if (!hiddenQuantity) return;

        const liveQuantity = Math.max(
          1,
          Number.parseInt(hiddenQuantity.querySelector("span")?.textContent ?? "1", 10) || 1,
        );
        const buttons = hiddenQuantity.querySelectorAll<HTMLButtonElement>("button");
        const decrement = buttons[0];
        const increment = buttons[1];
        const difference = targetQuantity - liveQuantity;

        if (difference > 0 && increment) {
          for (let step = 0; step < difference; step += 1) increment.click();
        } else if (difference < 0 && decrement) {
          for (let step = 0; step < Math.abs(difference); step += 1) decrement.click();
        }
      });

      const chevron = document.createElement("span");
      chevron.className = "cart-line__quantity-chevron";
      chevron.setAttribute("aria-hidden", "true");

      quantityControl.append(select, chevron);
      const main = line.querySelector<HTMLElement>(".cart-line__main");
      main?.appendChild(quantityControl);
    }

    const select = quantityControl.querySelector<HTMLSelectElement>("select");
    if (select && select.value !== String(currentQuantity)) {
      select.value = String(currentQuantity);
    }
  });

  const checkoutSummary = cartLines.querySelector<HTMLElement>(".checkout-summary");
  if (!checkoutSummary) return;
  checkoutSummary.classList.add("checkout-summary--mcd");

  const originalCheckout = checkoutSummary.querySelector<HTMLButtonElement>(
    ":scope > button",
  );
  if (originalCheckout) originalCheckout.classList.add("cart-original-checkout");

  let footer = drawer.querySelector<HTMLDivElement>(".cart-drawer__footer-actions");
  if (!footer) {
    footer = document.createElement("div");
    footer.className = "cart-drawer__footer-actions";

    const orderMore = document.createElement("a");
    orderMore.className = "cart-drawer__order-more";
    orderMore.href = "/menu/burgers";
    orderMore.textContent = "Order More";

    const checkout = document.createElement("button");
    checkout.className = "cart-drawer__checkout";
    checkout.type = "button";
    checkout.textContent = "Check out";
    checkout.addEventListener("click", () => {
      const sourceButton = drawer.querySelector<HTMLButtonElement>(
        ".checkout-summary > button",
      );
      sourceButton?.click();
    });

    footer.append(orderMore, checkout);
    drawer.appendChild(footer);
  }

  const checkoutProxy = footer.querySelector<HTMLButtonElement>(
    ".cart-drawer__checkout",
  );
  if (checkoutProxy && originalCheckout) {
    checkoutProxy.disabled = originalCheckout.disabled;
    checkoutProxy.textContent = originalCheckout.disabled
      ? "Ordering unavailable"
      : "Check out";
  }
}

export default function CartDrawerEnhancer() {
  useEffect(() => {
    let frame = 0;
    const scheduleEnhancement = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        enhanceCartDrawer();
      });
    };

    scheduleEnhancement();
    const observer = new MutationObserver(scheduleEnhancement);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
