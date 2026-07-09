import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/shared/service-worker-registration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Workforce — Verified Industrial Labour Hiring in Hyderabad",
    template: "%s | Workforce",
  },
  description:
    "Workforce connects verified factory workers with trusted employers in Hyderabad. Post jobs, find workers, and hire with confidence.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
  openGraph: {
    title: "Workforce — Verified Industrial Labour Hiring",
    description:
      "The trusted platform connecting industrial workers with verified employers in Hyderabad. No fake listings. No spam.",
    type: "website",
    locale: "en_IN",
    siteName: "Workforce",
  },
  twitter: {
    card: "summary_large_image",
    title: "Workforce — Verified Industrial Labour Hiring",
    description:
      "The trusted platform connecting industrial workers with verified employers in Hyderabad.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Workforce",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  themeColor: "#1a1a2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
