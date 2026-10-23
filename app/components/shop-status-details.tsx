"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Store } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ServiceStatus } from "../lib/service";

export default function ShopStatusDetails({ status }: { status: ServiceStatus }) {
  const [open, setOpen] = useState(false);
  const unavailable = status.statusLabel === "Ordering temporarily unavailable";
  const Icon = unavailable ? Clock3 : Store;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="shop-status-bar">
        <span className="shop-status-bar__label"><Icon size={18} aria-hidden="true" />
          {unavailable ? "Ordering unavailable" : "Online ordering closed"}
        </span>
        <span className="shop-status-bar__hint">You can still browse the menu</span>
        <SheetTrigger className="shop-status-bar__details" aria-label="View ordering details">Details <ArrowRight size={16} aria-hidden="true" /></SheetTrigger>
      </div>
      <SheetContent side="bottom" className="shop-status-panel" overlayClassName="shop-status-panel-overlay">
        <div className="shop-status-panel__icon"><Icon size={28} aria-hidden="true" /></div>
        <SheetTitle className="shop-status-panel__title">{unavailable ? "Ordering temporarily unavailable" : "We're closed for online orders"}</SheetTitle>
        <SheetDescription className="shop-status-panel__description">{status.notice}</SheetDescription>
        <p className="shop-status-panel__hint">The menu is still here. Find your next favourite while you wait.</p>
        <Link href="/menu/burgers" className="shop-status-panel__action" onClick={() => setOpen(false)}>Browse menu <ArrowRight size={18} aria-hidden="true" /></Link>
      </SheetContent>
    </Sheet>
  );
}
