// app/layout.tsx
import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Providers from "./providers"; // Includes Language & Query providers
import "./globals.css";

export const metadata: Metadata = {
  title: "Who Is Next",
  description: "Current custody records and polls about arrests and detentions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ne">
      <body className="bg-background text-on-surface font-body antialiased">
        <Providers>
          {/* 1. The Navbar goes here at the top */}
          <Navbar />

          {/* 2. Use a 'main' tag with top padding (pt-16) 
             to prevent the fixed navbar from covering your content 
          */}
          <main className="min-h-screen pt-16 px-6 md:px-12 max-w-screen-2xl mx-auto">
            {children}
          </main>

          {/* 3. The Footer goes here at the bottom */}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}