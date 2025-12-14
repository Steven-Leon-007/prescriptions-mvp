import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";
import { AuthProvider, Navbar } from "@/components";

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
});

const mulishMono = Mulish({
  variable: "--font-mulish-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prescriptions MVP",
  description: "Sistema de gestión de prescripciones médicas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${mulish.variable} ${mulishMono.variable} antialiased`}
      >
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
