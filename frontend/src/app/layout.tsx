import type { Metadata } from "next";
import "./globals.css";

import { AuthProvider } from "../context/AuthContext";

export const metadata: Metadata = {
  title: "Agentic AI Framework for Smart Agriculture",
  description: "An industry-grade Agentic AI framework designed to assist farmers by autonomously monitoring, analyzing, planning, and recommending farming activities in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
