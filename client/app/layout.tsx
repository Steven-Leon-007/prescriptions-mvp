import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";
import { AuthProvider, ConditionalLayout } from "@/components";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

export default function RootLayout({ children, }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${mulish.variable} ${mulishMono.variable} antialiased`}
      >
        <AuthProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </body>
    </html>
  );
}
