"use client";

import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBrowserClientOrNull } from "../lib/supabase/client";

type SignInMethod = "loading" | "password" | "google" | "unavailable";

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
};

function PasswordField({ id, label, value, onChange, autoComplete }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="account-security__field" htmlFor={id}>
      <span>{label}</span>
      <span className="account-security__input-wrap">
        <Input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={256}
          minLength={autoComplete === "new-password" ? 10 : undefined}
          required
          spellCheck={false}
          className="account-security__input"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="account-security__visibility"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </Button>
      </span>
    </label>
  );
}

export default function AccountChangePassword() {
  const [signInMethod, setSignInMethod] = useState<SignInMethod>("loading");
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = getBrowserClientOrNull();
    if (!supabase) {
      setSignInMethod("unavailable");
      return;
    }

    let active = true;
    void (async () => {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        const user = data.user as User | null;
        if (!active) return;
        if (authError || !user) {
          setSignInMethod("unavailable");
          return;
        }
        const providers = user.identities?.map((identity) => identity.provider) ?? [];
        const linkedProviders = Array.isArray(user.app_metadata?.providers)
          ? (user.app_metadata.providers as unknown[])
          : [];
        const googleOnly =
          providers.includes("google") &&
          !providers.includes("email") &&
          !linkedProviders.includes("email");
        setSignInMethod(googleOnly ? "google" : "password");
      } catch {
        if (active) setSignInMethod("unavailable");
      }
    })();

    return () => { active = false; };
  }, []);

  function closeForm() {
    setOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || signInMethod !== "password") return;
    setError("");
    setSuccess(false);

    if (newPassword.length < 10 || newPassword.length > 256) {
      setError("Use a new password between 10 and 256 characters.");
      return;
    }
    if (currentPassword === newPassword) {
      setError("Choose a new password that differs from your current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setError(result.error ?? "We could not change your password. Please try again.");
        setCurrentPassword("");
        return;
      }
      closeForm();
      setSuccess(true);
    } catch {
      setError("We could not change your password. Please try again.");
      setCurrentPassword("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="account-card account-security-card" aria-labelledby="account-security-title">
      <div className="account-security__header">
        <span className="account-security__icon" aria-hidden="true">
          <ShieldCheck size={23} strokeWidth={1.8} />
        </span>
        <div className="account-security__intro">
          <h2 id="account-security-title">Change password</h2>
          <p>Keep your account secure with a unique password.</p>
        </div>
        {signInMethod === "password" && (
          <Button
            type="button"
            variant="outline"
            className="account-security__toggle"
            aria-expanded={open}
            aria-controls="account-security-form"
            disabled={saving}
            onClick={() => {
              if (open) {
                closeForm();
              } else {
                setSuccess(false);
                setOpen(true);
              }
            }}
          >
            {open ? "Cancel" : "Change"}
          </Button>
        )}
      </div>

      {signInMethod === "loading" && (
        <p className="account-security__note" role="status">Checking sign-in method…</p>
      )}

      {signInMethod === "google" && (
        <p className="account-security__note">
          You sign in with Google. Manage your Google password in your{" "}
          <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">
            Google Account settings
          </a>
          . To add a password for Nasty Burger House, use{" "}
          <Link href="/account/forgot-password">password recovery</Link>.
        </p>
      )}

      {signInMethod === "unavailable" && (
        <p className="account-security__note">
          Password changes are unavailable right now.{" "}
          <Link href="/account/forgot-password">Try password recovery</Link>.
        </p>
      )}

      {success && <p className="account-security__success" role="status">Your password has been updated successfully.</p>}

      {signInMethod === "password" && open && (
        <form id="account-security-form" className="account-security__form" onSubmit={(event) => void submit(event)}>
          <PasswordField
            id="account-current-password"
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
          />
          <PasswordField
            id="account-new-password"
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <PasswordField
            id="account-confirm-password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />
          <p className="account-security__hint">At least 10 characters. Use a password you don&apos;t use elsewhere.</p>
          {error && <p className="account-form-error" role="alert">{error}</p>}
          <Button type="submit" disabled={saving} className="account-security__submit">
            <KeyRound size={17} aria-hidden="true" />
            {saving ? "Updating password…" : "Update password"}
          </Button>
          <Link className="account-security__recovery" href="/account/forgot-password">
            Forgot your current password?
          </Link>
        </form>
      )}
    </section>
  );
}
