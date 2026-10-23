"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

type Announcement4Props = {
  onDismiss?: () => void;
  title?: string;
  detail?: string;
};

export default function Announcement4({ onDismiss, title = "WE’RE OPEN 7 DAYS", detail = "11:30 AM – 10:00 PM" }: Announcement4Props) {
  return (
    <div className="announcement-4">
      <span className="announcement-4__title">{title}</span>

      <span
        aria-hidden="true"
        className="announcement-4__separator"
      />

      <span className="announcement-4__hours">{detail}</span>

      {onDismiss ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          aria-label="Dismiss opening hours announcement"
          className="announcement-4__close"
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
