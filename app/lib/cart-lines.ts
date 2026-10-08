import type { CartLine } from "./order";

// The order API accepts up to 20 of the same configured item per cart row.
// Keep additional quantities in a separate row rather than exceeding that limit.
const MAX_QUANTITY_PER_LINE = 20;

/** A stable identity for an item AND the way it was prepared. */
export function cartConfigurationKey(line: CartLine): string {
  const modifiers = (line.modifiers ?? [])
    .filter((modifier) => modifier.quantity > 0)
    .map(({ id, quantity }) => [id, quantity] as const)
    .sort((a, b) => a[0].localeCompare(b[0]));

  // These arrays represent selections, not positioning: selection order
  // must not split otherwise identical customer orders.
  const sorted = (values: string[] | undefined) => [...(values ?? [])].sort();

  return JSON.stringify([
    line.itemId,
    Boolean(line.combo),
    line.combo ? (line.drink ?? "") : "",
    modifiers,
    sorted(line.removedIngredients),
    sorted(line.boxBurgers),
    sorted(line.boxDrinks),
  ]);
}

/**
 * Consolidate like-for-like cart rows, keeping the earliest row's ID and
 * its customizations. Different preparations remain distinct cart items.
 *
 * Never allow a merged line to exceed the backend's quantity limit.
 * If 20 have already been reached, overflow stays in another row.
 */
export function mergeIdenticalCartLines(lines: CartLine[]): CartLine[] {
  const merged: CartLine[] = [];
  const keys: string[] = [];

  for (const line of lines) {
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) continue;
    let remaining = Math.floor(line.quantity);
    const key = cartConfigurationKey(line);

    for (let index = 0; index < merged.length && remaining > 0; index++) {
      const target = merged[index];
      if (keys[index] !== key || target.quantity >= MAX_QUANTITY_PER_LINE) continue;

      const added = Math.min(MAX_QUANTITY_PER_LINE - target.quantity, remaining);
      merged[index] = { ...target, quantity: target.quantity + added };
      remaining -= added;
    }

    // Source lines should already be capped at 20. This also safely handles
    // larger quantities from legacy or otherwise malformed persisted carts.
    let segment = 0;
    while (remaining > 0) {
      const quantity = Math.min(MAX_QUANTITY_PER_LINE, remaining);
      merged.push({
        ...line,
        lineId: segment === 0 ? line.lineId : `${line.lineId}-${segment}`,
        quantity,
      });
      keys.push(key);
      remaining -= quantity;
      segment++;
    }
  }

  return merged;
}
