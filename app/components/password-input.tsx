"use client";

import { useState } from "react";

type PasswordInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  required?: boolean;
};

export default function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  required = true,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label>
      {label}
      <div style={{ position: "relative" }}>
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
          style={{ paddingRight: "3.15rem" }}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          style={{
            position: "absolute",
            top: "50%",
            right: "0.8rem",
            display: "grid",
            width: "2rem",
            height: "2rem",
            placeItems: "center",
            transform: "translateY(-50%)",
            border: 0,
            borderRadius: "999px",
            background: "transparent",
            color: "#6d665e",
            cursor: "pointer",
          }}
        >
          {visible ? (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M10.6 10.7a2 2 0 002.7 2.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M9.9 5.2A10.6 10.6 0 0112 5c5.4 0 8.5 5 8.5 5s-.9 1.5-2.6 2.9M6.1 6.1C4.4 7.2 3.5 9 3.5 9s3.1 5 8.5 5c1 0 1.9-.2 2.7-.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3.5 12s3.1-5 8.5-5 8.5 5 8.5 5-3.1 5-8.5 5-8.5-5-8.5-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          )}
        </button>
      </div>
    </label>
  );
}
