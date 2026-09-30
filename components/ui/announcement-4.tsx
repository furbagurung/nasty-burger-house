"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

type Announcement4Props = {
  onDismiss?: () => void;
};

export default function Announcement4({ onDismiss }: Announcement4Props) {
  return (
    <div className="relative flex w-full max-w-[1180px] items-center justify-center gap-2 px-10 text-center sm:gap-3 sm:px-12">
      <span className="font-extrabold uppercase tracking-[0.02em]">
        WE&apos;RE OPEN 7 DAYS
      </span>

      <span
        aria-hidden="true"
        className="hidden size-1 shrink-0 rounded-full bg-white/55 sm:block"
      />

      <span className="font-semibold">11:30 AM – 10:00 PM</span>

      {onDismiss ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          aria-label="Dismiss opening hours announcement"
          className="absolute right-0 size-8 rounded-full text-white hover:bg-white/15 hover:text-white sm:right-1"
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
