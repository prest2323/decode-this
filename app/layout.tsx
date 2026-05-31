import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { DocProvider } from "@/lib/store";

// Display: a warm, soft serif with optical sizing — friendly, never cold.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

// Body/UI: a humanist grotesk that reads warm and approachable.
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Decode It — a gentler way through hard paperwork",
  description:
    "Drop in any complex document — a loan application, a benefits form — and we walk you through every step, calmly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${hanken.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-ink">
        <DocProvider>{children}</DocProvider>
      </body>
    </html>
  );
}
