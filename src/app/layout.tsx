import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AppToaster } from "@/components/ui/AppToaster";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Wave & Co.",
    template: "%s | Wave & Co.",
  },
  description:
    "Luxury architectural eyewear crafted with precision, material clarity, and intentional form.",
  icons: {
    icon: [{ url: "/Logo.png", type: "image/png" }],
    shortcut: [{ url: "/Logo.png", type: "image/png" }],
    apple: [{ url: "/Logo.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-brand-cream text-brand-black font-sans antialiased">
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
