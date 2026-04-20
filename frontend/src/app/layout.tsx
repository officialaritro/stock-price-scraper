import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockSpy | Real-time Stock Price Dashboard",
  description: "Monitor NSE India stocks in real-time with price alerts and historical charts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}