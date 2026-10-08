"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface SocialProvider {
  name: string;
  icon: ReactNode;
  onClick?: () => void;
}

export interface Auth1Props {
  badgeText?: string;
  heading?: string;
  subheading?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  passwordLabel?: string;
  passwordPlaceholder?: string;
  submitLabel?: string;
  socialProviders?: SocialProvider[];
  /** Use this slot for the existing real OAuth button and callback flow. */
  socialContent?: ReactNode;
  dividerText?: string;
  forgotPasswordText?: string;
  onForgotPassword?: () => void;
  bottomPromptText?: string;
  bottomPromptLinkText?: string;
  onBottomPromptClick?: () => void;
  onSubmit?: (identifier: string, password: string) => void | Promise<void>;
  footerNote?: string;
  /** Local-only sign-in has no password; production uses Supabase. */
  showPasswordField?: boolean;
  submitting?: boolean;
  error?: string;
  identifierType?: "text" | "email";
}

export function Auth1({
  badgeText = "Secure sign-in",
  heading = "Welcome back",
  subheading = "Your orders, rewards and favourites are waiting.",
  emailLabel = "Email address or mobile number",
  emailPlaceholder = "Email or 04XX XXX XXX",
  passwordLabel = "Password",
  passwordPlaceholder = "Enter your password",
  submitLabel = "Sign in",
  socialProviders = [],
  socialContent,
  dividerText = "or continue with",
  forgotPasswordText = "Forgot password?",
  onForgotPassword,
  bottomPromptText = "New to Nasty?",
  bottomPromptLinkText = "Create an account",
  onBottomPromptClick,
  onSubmit,
  footerNote = "Secure customer access",
  showPasswordField = true,
  submitting = false,
  error = "",
  identifierType = "text",
}: Auth1Props) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    void onSubmit?.(identifier.trim(), password);
  }

  return (
    <div className="nbh-auth-shell dark nbh-auth-shell--dark">
      <div className="nbh-auth-container">
        <Card className="nbh-auth-card gap-0 rounded-[2rem] p-2">
          <div className="nbh-auth-card-inner rounded-[1.5rem] py-7">
            <CardHeader className="space-y-3 px-5 pb-6 text-center sm:px-7">
              <span className="nbh-auth-badge">
                <ShieldCheck size={14} aria-hidden="true" /> {badgeText}
              </span>
              <CardTitle className="nbh-auth-heading text-2xl font-extrabold tracking-tight sm:text-[1.75rem]">
                {heading}
              </CardTitle>
              <CardDescription className="nbh-auth-subheading text-sm leading-relaxed">
                {subheading}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 px-5 sm:px-7">
              <form onSubmit={handleSubmit} className="space-y-4" aria-label="Customer sign-in form">
                <div className="space-y-2">
                  <label htmlFor="nbh-auth-identifier" className="nbh-auth-label">{emailLabel}</label>
                  <div className="relative">
                    <MdEmail aria-hidden="true" className="nbh-auth-input-icon absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="nbh-auth-identifier"
                      name="identifier"
                      type={identifierType}
                      autoComplete="username"
                      inputMode={identifierType === "email" ? "email" : "text"}
                      placeholder={emailPlaceholder}
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      className="nbh-auth-input h-11 pl-10"
                      maxLength={180}
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>

                {showPasswordField && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="nbh-auth-password" className="nbh-auth-label">{passwordLabel}</label>
                      {onForgotPassword && (
                        <button type="button" onClick={onForgotPassword} className="nbh-auth-text-link">
                          {forgotPasswordText}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <MdLock aria-hidden="true" className="nbh-auth-input-icon absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
                      <Input
                        id="nbh-auth-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={passwordPlaceholder}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="nbh-auth-input h-11 pl-10 pr-11"
                        maxLength={256}
                        disabled={submitting}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="nbh-auth-password-toggle"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <MdVisibilityOff aria-hidden="true" size={19} /> : <MdVisibility aria-hidden="true" size={19} />}
                      </button>
                    </div>
                  </div>
                )}

                {error && <p className="nbh-auth-error" role="alert">{error}</p>}

                <Button
                  type="submit"
                  className="nbh-auth-submit h-11 w-full rounded-xl text-sm font-bold"
                  disabled={submitting}
                >
                  {submitting ? "Signing in…" : submitLabel}
                </Button>
              </form>

              {(socialContent || socialProviders.length > 0) && (
                <>
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="nbh-auth-divider-text shrink-0 text-xs">{dividerText}</span>
                    <Separator className="flex-1" />
                  </div>
                  <div className="nbh-auth-social">
                    {socialContent}
                    {socialProviders.filter((provider) => typeof provider.onClick === "function").map((provider) => (
                      <Button
                        key={provider.name}
                        variant="outline"
                        type="button"
                        className="nbh-auth-social-provider h-10 w-full"
                        onClick={provider.onClick}
                        aria-label={`Continue with ${provider.name}`}
                      >
                        {provider.icon}
                        <span>{provider.name}</span>
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </div>

          <CardFooter className="nbh-auth-card-footer justify-center border-0 py-5 text-center">
            <p className="nbh-auth-bottom-prompt text-sm">
              {bottomPromptText}{" "}
              <button
                type="button"
                className="nbh-auth-text-link nbh-auth-sign-up"
                onClick={onBottomPromptClick}
              >
                {bottomPromptLinkText}
              </button>
            </p>
          </CardFooter>
        </Card>

        <p className="nbh-auth-footnote">{footerNote}</p>
      </div>
    </div>
  );
}
