import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/src/store/ReduxProvider";

export const metadata: Metadata = {
  title: "Waffle Forever Sales Dashboard",
  description: "Sales analytics dashboard for Waffle Forever using Rista POS APIs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
