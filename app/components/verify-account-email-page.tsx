"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function VerifyAccountEmailPage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"ready" | "checking" | "success" | "error">("ready");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // The fragment is never sent to the server or included in HTTP access logs.
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
    setToken(value);
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, []);

  async function verify() {
    if (!token || status === "checking") return;
    setStatus("checking");
    try {
      const response = await fetch("/api/account/email-addresses/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Verification link is invalid or expired.");
      setToken(""); setStatus("success");
      setMessage("Your additional email is verified. You can now sign in using it and your existing password.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Verification failed.");
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-12">
      <Card className="w-full border-border bg-card text-card-foreground">
        <CardContent className="space-y-4 p-6">
          <h1 className="text-2xl font-bold">Verify email address</h1>
          <p className="text-sm text-muted-foreground">Confirm this email to use it when signing in to your Nasty Burger House account.</p>
          {status === "success" ? <p role="status">{message}</p> : (
            <>
              {!token && status === "ready" && <p role="alert">This verification link is missing its token.</p>}
              {status === "error" && <p className="text-sm text-destructive" role="alert">{message}</p>}
              <Button type="button" onClick={() => void verify()} disabled={!token || status === "checking"}>
                {status === "checking" ? "Verifying…" : "Verify email"}
              </Button>
            </>
          )}
          <p><Link className="underline underline-offset-4" href="/account">Return to account</Link></p>
        </CardContent>
      </Card>
    </main>
  );
}
