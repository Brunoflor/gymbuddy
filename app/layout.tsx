import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import { it } from "@/lib/i18n/it";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: { default: it.appName, template: `%s · ${it.appName}` },
  description: it.metaDescription,
  applicationName: it.appName,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: it.appName, statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1e3a32",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${outfit.variable} ${fraunces.variable}`}>
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
