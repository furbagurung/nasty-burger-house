"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signInCustomerByEmail } from "../lib/customer-store";
import MobileBottomNav from "./mobile-bottom-nav";

export default function AccountSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const profile = signInCustomerByEmail(email);
    if (!profile) {
      setError("No saved account with that email exists on this device yet.");
      return;
    }
    router.push("/account");
  }

  return (
    <div className="standalone-page account-page">
      <main className="standalone-main account-auth-main">
        <section className="account-auth-card account-auth-card--compact">
          <div className="account-auth-card__intro">
            <p className="standalone-eyebrow">Welcome back</p>
            <h1>Sign in.</h1>
            <p>Open your saved Nasty account, Drip Points and order history.</p>
          </div>
          <form className="account-auth-form" onSubmit={submit}>
            <label>
              Email address
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </label>
            {error && <p className="account-form-error" role="alert">{error}</p>}
            <button className="standalone-primary-button" type="submit">Continue</button>
            <p className="account-auth-note">This development build uses a device session. Production sign-in will use secure authentication instead of browser-stored identity.</p>
            <p className="account-auth-switch">New here? <Link href="/account/create">Create an account</Link></p>
          </form>
        </section>
      </main>
      <MobileBottomNav active="more" />
    </div>
  );
}
