import type { Metadata, Viewport } from "next";
import { Anton, Geist } from "next/font/google";
import "./globals.css";

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Minna — your personal assistant",
  description: "Minna keeps track of your plans, deadlines and the small things, and reminds you until they're done.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "Minna", statusBarStyle: "default" },
  openGraph: {
    title: "Minna",
    description: "Your life. More organized. Less overwhelming.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7fafd",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${anton.variable} ${geist.variable}`}>
      <body>{children}</body>
    </html>
  );
}
