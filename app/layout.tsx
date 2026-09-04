import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import FooterLegalLinks from "./components/footer-legal-links";
import HomeTopHeader from "./components/home-top-header";
import "./globals.css";
import "./catalogue-theme.css";
import "./mobile-app.css";
import "./home-top-header.css";
import "./footer-dark.css";
import "./product-detail-premium.css";
import "./product-light-body.css";

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
      </body>
    </html>
  );
}
