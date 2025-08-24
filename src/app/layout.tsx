import type { Metadata } from "next";
import {Manrope } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Clobber",
  description: "Teching, but with AI",
};

const font = Manrope({subsets: ['latin']})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${font.className} antialiased`}
      >
        <AppProviders>
          {children}
        </AppProviders>
        <Toaster richColors />
      </body>
    </html>
  );
}
