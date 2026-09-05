import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CookieSettings from "./components/cookie-settings";
import FooterLegalLinks from "./components/footer-legal-links";
import HomeTopHeader from "./components/home-top-header";
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
import "./drip-points.css";
import "./cookie-settings.css";
import "./help-support.css";

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
        <FooterLegalLinks />
        <CookieSettings />
      </body>
    </html>
  );
}
