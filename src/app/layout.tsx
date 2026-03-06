// Auto Business v3.2.0 — VISION + Blob storage integration
import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Serif_Display } from "next/font/google";
import { SITE_DESCRIPTION } from "@/lib/constants";
import { ThemeProvider } from "@/components/ui/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
});

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://auto-business.vercel.app").trim().replace(/\/+$/, "");

export const metadata: Metadata = {
  title: {
    default: "Auto Business — AI Agent Studio",
    template: "%s | Auto Business",
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "Auto Business — AI Agent Studio",
    description: "Four specialist AI agents — strategy, research, procurement, and sales — that deliver structured work in minutes. Pay only for what you use.",
    url: BASE_URL,
    siteName: "Auto Business",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Auto Business — AI Agent Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Auto Business — AI Agent Studio",
    description: "Describe the work. Agents build it. Powered by Nevermined.",
    images: ["/og-image.svg"],
  },
  keywords: ["AI agents", "autonomous business", "Nevermined", "AI research", "agent commerce", "x402 payments", "AI pipeline", "business automation"],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${dmSerif.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
