import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "A Memory, Rehearsed",
  description: "An interactive encounter between personal memory and its echoes in theatre.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white antialiased min-h-screen selection:bg-white selection:text-black`}>
        {children}
      </body>
    </html>
  );
}
