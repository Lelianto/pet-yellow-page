import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AnabulCare — Layanan Hewan Peliharaan Terdekat",
  description:
    "Temukan grooming, dokter hewan, pet hotel, dan pet shop terpercaya di sekitarmu. Hubungi langsung via WhatsApp.",
  keywords: ["pet care", "grooming", "dokter hewan", "pet hotel", "pet shop", "anabul", "kucing", "anjing"],
  openGraph: {
    title: "AnabulCare — Layanan Hewan Peliharaan Terdekat",
    description: "Grooming, vet, hotel & pet shop lokal — satu tap langsung WhatsApp.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">{children}</body>
    </html>
  );
}
