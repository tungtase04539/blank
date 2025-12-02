import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quick Link System",
  description: "Quick link system with tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

