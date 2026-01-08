import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quick Link System",
  description: "Quick link system with tracking",
  other: {
    "6a97888e-site-verification": "8ec10c70099d42dd02ee4be17dcaae0e",
  },
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

