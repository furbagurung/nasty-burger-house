"use client";

import { useEffect, useState } from "react";

const COOKIE_STORAGE_KEY = "nasty-burger-cookie-preferences";

type CookiePreferences = {
  analytics: boolean;
  marketing: boolean;
};

const defaultPreferences: CookiePreferences = {
  analytics: false,
  marketing: false,
};

export default function CookieSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] =
    useState<CookiePreferences>(defaultPreferences);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(COOKIE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<CookiePreferences>;
        setPreferences({
          analytics: Boolean(parsed.analytics),
          marketing: Boolean(parsed.marketing),
        });
      } catch {
        window.localStorage.removeItem(COOKIE_STORAGE_KEY);
      }
    }

    const openSettings = () => {
      setSavedMessage("");
      setIsOpen(true);
    };

    window.addEventListener("nasty:open-cookie-settings", openSettings);
    return () =>
      window.removeEventListener("nasty:open-cookie-settings", openSettings);
  }, []);

  const save = (next: CookiePreferences) => {
    setPreferences(next);
    window.localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(next));
    setSavedMessage("Your cookie preferences have been saved.");
    window.setTimeout(() => setIsOpen(false), 450);
  };

  if (!isOpen) return null;

  return (
    <div className="cookie-settings-backdrop" role="presentation">
      <section
        className="cookie-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-settings-title"
      >
        <button
          className="cookie-settings-close"
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close cookie settings"
        >
          ×
        </button>

        <p className="cookie-settings-eyebrow">Your privacy</p>
        <h2 id="cookie-settings-title">Cookie settings</h2>
        <p className="cookie-settings-intro">
          Choose which optional cookies you allow. Strictly necessary storage
          stays on because it is required for core site features such as your
          cart and saved preferences.
        </p>

        <div className="cookie-settings-options">
          <div className="cookie-setting-row">
            <div>
              <strong>Strictly necessary</strong>
              <p>Required for essential site and ordering functionality.</p>
            </div>
            <span className="cookie-setting-required">Always on</span>
          </div>

          <label className="cookie-setting-row cookie-setting-row--toggle">
            <div>
              <strong>Analytics</strong>
              <p>
                Helps us understand site usage if analytics services are enabled.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.analytics}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  analytics: event.target.checked,
                }))
              }
            />
          </label>

          <label className="cookie-setting-row cookie-setting-row--toggle">
            <div>
              <strong>Marketing</strong>
              <p>
                Allows marketing-related storage if those services are enabled.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.marketing}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  marketing: event.target.checked,
                }))
              }
            />
          </label>
        </div>

        {savedMessage && (
          <p className="cookie-settings-saved" role="status">
            {savedMessage}
          </p>
        )}

        <div className="cookie-settings-actions">
          <button
            type="button"
            className="cookie-settings-secondary"
            onClick={() => save(defaultPreferences)}
          >
            Reject optional
          </button>
          <button
            type="button"
            className="cookie-settings-secondary"
            onClick={() => save({ analytics: true, marketing: true })}
          >
            Accept all
          </button>
          <button
            type="button"
            className="cookie-settings-primary"
            onClick={() => save(preferences)}
          >
            Save choices
          </button>
        </div>
      </section>
    </div>
  );
}
