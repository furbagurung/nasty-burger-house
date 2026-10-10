"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        setError(result.error || "Invalid credentials or access denied.");
        return;
      }

      const destination =
        new URLSearchParams(window.location.search).get("return") ?? "/admin";
      const safeDestination =
        destination.startsWith("/admin") && !destination.startsWith("//")
          ? destination
          : "/admin";

      router.replace(safeDestination);
      router.refresh();
    } catch {
      setError("Admin sign in is temporarily unavailable. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-access-page admin-login-page">
      <Card className="admin-login-card" size="sm">
        <header className="admin-login-brand">
          <Image
            src="/logo.webp"
            alt="Nasty Burger House"
            width={56}
            height={56}
            priority
          />
          <div>
            <p>Nasty Burger House</p>
            <h1>Order Control</h1>
          </div>
        </header>

        <form className="admin-login-form" onSubmit={submit}>
          <div className="admin-login-field">
            <Label htmlFor="admin-login-email">Email address</Label>
            <Input
              id="admin-login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              maxLength={160}
              required
              autoFocus
            />
          </div>
          <div className="admin-login-field">
            <div className="admin-login-field-heading">
              <Label htmlFor="admin-login-password">Password</Label>
              <Link href="/account/forgot-password">Forgot password?</Link>
            </div>
            <div className="admin-login-password-wrap">
              <Input
                id="admin-login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                maxLength={256}
                required
              />
              <Button
                variant="ghost"
                size="icon"
                className="admin-login-password-toggle"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                aria-controls="admin-login-password"
                onClick={() => setShowPassword((current) => !current)}
                disabled={submitting}
              >
                {showPassword ? (
                  <EyeOff size={19} strokeWidth={1.8} aria-hidden="true" />
                ) : (
                  <Eye size={19} strokeWidth={1.8} aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <p className="admin-login-error" role="alert">
              {error}
            </p>
          )}

          <Button className="admin-login-submit" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <div className="admin-login-footer">
          <Link href="/">Back to website</Link>
        </div>
      </Card>
    </main>
  );
}
