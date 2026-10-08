"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  COOKIE_STORAGE_KEY,
  DEFAULT_COOKIE_PREFERENCES,
  filterConsentEvent,
  parseCookiePreferences,
  type CookiePreferences,
} from "../lib/cookie-preferences";

export default function CookieSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [savedPreferences, setSavedPreferences] = useState<CookiePreferences | null>(null);
  const [preferences, setPreferences] = useState(DEFAULT_COOKIE_PREFERENCES);
  const [savedMessage, setSavedMessage] = useState("");
  const consentRef = useRef<CookiePreferences | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const openSettings = useCallback(() => {
    setPreferences(consentRef.current ?? DEFAULT_COOKIE_PREFERENCES);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const applySaved = (next: CookiePreferences | null) => {
      consentRef.current = next;
      setSavedPreferences(next);
      setPreferences(next ?? DEFAULT_COOKIE_PREFERENCES);
      setShowBanner(next === null);
    };

    try {
      applySaved(parseCookiePreferences(window.localStorage.getItem(COOKIE_STORAGE_KEY)));
    } catch {
      // Browsers that block storage still get usable, default-off controls.
      applySaved(null);
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === COOKIE_STORAGE_KEY || event.key === null) {
        applySaved(parseCookiePreferences(event.newValue));
      }
    };

    window.addEventListener("nasty:open-cookie-settings", openSettings);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("nasty:open-cookie-settings", openSettings);
      window.removeEventListener("storage", onStorage);
      consentRef.current = null;
    };
  }, [openSettings]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    closeRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const save = (next: CookiePreferences) => {
    // The ref blocks events immediately, including callbacks in already loaded scripts.
    consentRef.current = next;
    setSavedPreferences(next);
    setPreferences(next);
    setShowBanner(false);
    setIsOpen(false);
    try {
      window.localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(next));
      setSavedMessage("Your cookie preferences have been saved.");
    } catch {
      setSavedMessage("Preferences saved for this visit. Browser storage is unavailable.");
    }
  };

  return (
    <>
      {showBanner && !isOpen && (
        <section
          className="cookie-consent-banner"
          aria-labelledby="cookie-consent-title"
        >
          <div className="cookie-consent-copy">
            <h2 id="cookie-consent-title">Cookie Preferences</h2>
            <p>
              We use essential cookies and browser storage to keep your cart,
              account and preferences working. With your permission, optional
              analytics help us understand how our website is used and how it
              performs. You can agree to optional preferences, reject
              non-essential use, or choose your settings.
            </p>
            <p>
              Read our <Link href="/privacy-policy">Privacy Policy</Link> and{" "}
              <Link href="/terms-and-conditions">Terms and Conditions</Link>.
              You can change your choices anytime using Cookie Settings in the footer.
            </p>
          </div>
          <div className="cookie-consent-actions">
            <button type="button" onClick={() => save({ analytics: true, marketing: true })}>
              Agree
            </button>
            <button type="button" onClick={() => save(DEFAULT_COOKIE_PREFERENCES)}>
              Reject non-essential
            </button>
            <button type="button" onClick={openSettings}>
              Cookie preferences
            </button>
          </div>
        </section>
      )}

      <dialog
        ref={dialogRef}
        className="cookie-settings-modal"
        aria-labelledby="cookie-settings-title"
        aria-describedby="cookie-settings-intro"
        onCancel={(event) => {
          event.preventDefault();
          setIsOpen(false);
        }}
      >
        <button
          ref={closeRef}
          className="cookie-settings-close"
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close cookie preferences"
        >
          ×
        </button>
        <h2 id="cookie-settings-title">Cookie Preferences</h2>
        <p id="cookie-settings-intro" className="cookie-settings-intro">
          You control optional analytics and marketing preferences. Essential
          storage stays on for your cart, account and saved choices.
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
              <strong id="cookie-analytics-label">Analytics</strong>
              <p id="cookie-analytics-description">
                Allow website usage and performance measurement.
              </p>
            </div>
            <input
              type="checkbox"
              role="switch"
              aria-labelledby="cookie-analytics-label"
              aria-describedby="cookie-analytics-description"
              checked={preferences.analytics}
              onChange={(event) =>
                setPreferences((current) => ({ ...current, analytics: event.target.checked }))
              }
            />
          </label>

          <label className="cookie-setting-row cookie-setting-row--toggle">
            <div>
              <strong id="cookie-marketing-label">Marketing</strong>
              <p id="cookie-marketing-description">
                Optional advertising and campaign measurement, where available.
              </p>
            </div>
            <input
              type="checkbox"
              role="switch"
              aria-labelledby="cookie-marketing-label"
              aria-describedby="cookie-marketing-description"
              checked={preferences.marketing}
              onChange={(event) =>
                setPreferences((current) => ({ ...current, marketing: event.target.checked }))
              }
            />
          </label>
        </div>

        <div className="cookie-settings-actions">
          <button type="button" onClick={() => save(DEFAULT_COOKIE_PREFERENCES)}>
            Reject non-essential
          </button>
          <button type="button" onClick={() => save({ analytics: true, marketing: true })}>
            Agree to all
          </button>
          <button type="button" onClick={() => save(preferences)}>
            Save preferences
          </button>
        </div>
        <Link className="cookie-settings-policy" href="/privacy-policy" onClick={() => setIsOpen(false)}>
          Read our Privacy Policy
        </Link>
      </dialog>

      <p className="cookie-consent-status" role="status">{savedMessage}</p>

      {savedPreferences?.analytics === true && (
        <>
          <Analytics beforeSend={(event) => filterConsentEvent(consentRef.current, event)} />
          <SpeedInsights beforeSend={(event) => filterConsentEvent(consentRef.current, event)} />
        </>
      )}
    </>
  );
}
