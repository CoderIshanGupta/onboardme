import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OnboardMe — Understand any codebase in minutes",
  description:
    "Paste any GitHub repo URL and instantly get a voice walkthrough, architecture diagram, development insights, and everything you need to start contributing.",
  keywords: [
    "onboarding",
    "codebase",
    "github",
    "developer tools",
    "architecture diagram",
    "code analysis",
    "developer experience",
  ],
  openGraph: {
    title: "OnboardMe — Understand any codebase in minutes",
    description:
      "Paste any GitHub repo URL and instantly get a voice walkthrough, architecture diagram, and development insights.",
    url: "https://onboardme.dev",
    siteName: "OnboardMe",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OnboardMe — Understand any codebase in minutes",
    description:
      "Paste any GitHub repo URL and instantly get a voice walkthrough, architecture diagram, and development insights.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}