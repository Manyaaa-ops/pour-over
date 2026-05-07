import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pour-Over AI | Master the Art of Pouring",
  description: "Train your pour with real feedback, better rhythm, and cleaner patterns. The AI-powered platform for baristas and coffee enthusiasts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}