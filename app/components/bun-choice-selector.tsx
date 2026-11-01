import type { BunChoice } from "../data/menu";

type BunChoiceSelectorProps = {
  name: string;
  value: BunChoice;
  upgradePriceLabel: string;
  onChange: (choice: BunChoice) => void;
};

/**
 * One keyboard-accessible, mobile-first bun selector used by both ordering
 * surfaces. Only the bun changes; no claim is made about the complete burger.
 */
export default function BunChoiceSelector({
  name,
  value,
  upgradePriceLabel,
  onChange,
}: BunChoiceSelectorProps) {
  return (
    <fieldset className="product-bun-section">
      <legend>Choose your bun</legend>
      <div className="product-bun-options">
        {(["regular", "gluten-free"] as const).map((choice) => {
          const selected = value === choice;
          return (
            <label
              key={choice}
              className={`product-bun-option${selected ? " is-selected" : ""}`}
            >
              <input
                className="product-bun-option__input"
                type="radio"
                name={name}
                value={choice}
                checked={selected}
                aria-label={choice === "regular" ? "Regular bun" : "Gluten-free bun"}
                onChange={() => onChange(choice)}
              />
              <span className="product-bun-option__indicator" aria-hidden="true" />
              <span className="product-bun-option__name">
                {choice === "regular" ? "Regular bun" : "Gluten-free bun"}
              </span>
              <span className="product-bun-option__price">
                {choice === "regular" ? "Included" : upgradePriceLabel}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
