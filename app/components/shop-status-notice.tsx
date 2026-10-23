import Link from "next/link";
import { ArrowRight, Clock3, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ServiceStatus } from "../lib/service";

export default function ShopStatusNotice({ status, checkout = false }: { status: ServiceStatus; checkout?: boolean }) {
  if (status.acceptingOrders) return null;
  const unavailable = status.statusLabel === "Ordering temporarily unavailable";
  const Icon = unavailable ? Clock3 : Store;
  return (
    <Card className="shop-status-notice" role="status" aria-live="polite" aria-atomic="true">
      <CardContent className="shop-status-notice__content">
        <span className="shop-status-notice__icon"><Icon size={24} aria-hidden="true" /></span>
        <div className="shop-status-notice__copy">
          <h2>{unavailable ? "Ordering temporarily unavailable" : "Online ordering is closed"}</h2>
          <p>{status.notice}</p>
          <p className="shop-status-notice__hint">{checkout ? "Your basket stays here while you browse." : "Take a look around — the menu is still available."}</p>
        </div>
        <Link href="/menu/burgers" className="shop-status-notice__link">Browse menu <ArrowRight size={18} aria-hidden="true" /></Link>
      </CardContent>
    </Card>
  );
}
