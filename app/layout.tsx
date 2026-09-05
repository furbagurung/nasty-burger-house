import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CartDrawerEnhancer from "./components/cart-drawer-enhancer";
import CookieSettings from "./components/cookie-settings";
import DripPointsBanner from "./components/drip-points-banner";
import FooterLegalLinks from "./components/footer-legal-links";
import HomeTopHeader from "./components/home-top-header";
import MobileHeroControls from "./components/mobile-hero-controls";
import MobileHomeHeaderOverlay from "./components/mobile-home-header-overlay";
import "./globals.css";
import "./catalogue-theme.css";
import "./menu-browse.css";
import "./mobile-app.css";
import "./home-top-header.css";
import "./nav-marker.css";
import "./shared-header-pages.css";
import "./menu-catalogue-layout.css";
import "./footer-dark.css";
import "./footer-utility.css";
import "./product-detail-premium.css";
import "./product-light-body.css";
import "./product-page-refinements.css";
import "./product-extra-thumbnails.css";
import "./product-combo-drawer.css";
import "./product-customization-groups.css";
import "./product-fixed-layout.css";
import "./drip-points.css";
import "./drip-points-banner.css";
import "./cookie-settings.css";
import "./help-support.css";
import "./cart-drawer-mcdonalds.css";
import "./cart-drawer-motion.css";
import "./mobile-ux-polish.css";
import "./hero-motion-controls.css";
import "./mobile-hero-compact.css";
import "./mobile-home-header-overlay.css";
import "./mobile-app-header.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nasty Burger House | Order Pickup Online",
  description:
    "Browse the Nasty Burger House menu, customise your order and order ahead for pickup.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <HomeTopHeader />
        {children}
        <DripPointsBanner />
        <MobileHomeHeaderOverlay />
        <MobileHeroControls />
        <CartDrawerEnhancer />
        <FooterLegalLinks />
        <CookieSettings />
      </body>
    </html>
  );
}
