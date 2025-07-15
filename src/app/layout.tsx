import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { StackProvider } from "@stackframe/stack";
import { stackApp } from "@/lib/stack-client";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "tgathr",
  description: "Group coordination made simple",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <StackProvider app={stackApp}>
          {children}
        </StackProvider>
      </body>
    </html>
  );
}