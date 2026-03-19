import type { Metadata } from "next";
import { Nunito, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BuluBulu — Layanan Hewan Peliharaan Terdekat",
  description:
    "Temukan grooming, dokter hewan, pet hotel, dan pet shop terpercaya di sekitarmu. Hubungi langsung via WhatsApp.",
  keywords: ["pet care", "grooming", "dokter hewan", "pet hotel", "pet shop", "anabul", "kucing", "anjing"],
  openGraph: {
    title: "BuluBulu — Layanan Hewan Peliharaan Terdekat",
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
      className={`${nunito.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream font-body">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
