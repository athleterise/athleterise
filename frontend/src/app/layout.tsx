import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Athlete Rise",
  description: "Cricket Shot Analysis App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav
          style={{
            backgroundColor: "black",
            padding: "1rem"
          }}
        >
          <h1
            style={{
              color: "white",
              fontFamily: "var(--font-geist-sans)",
              fontSize: "1.75rem", // Increase font size
              fontWeight: "bold", // Make it bold
              letterSpacing: "0.05em", // Add slight spacing
              borderRadius: "8px", // Rounded curves effect
            }}
          >
            AthleteRise
          </h1>
        </nav>
        {children}
      </body>
    </html>
  );
}
