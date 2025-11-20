import type { Metadata } from "next";
import { Merriweather, Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Footer from "@/components/footer";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-merriweather",
});

export const metadata: Metadata = {
  title: "Schachturniere Magdeburg",
  description: "Alle Turniere und Events der Schachzwerge Magdeburg.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${poppins.variable} ${merriweather.variable} font-sans min-h-screen flex flex-col`}>
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
        <Toaster />
        <Script
          src="https://analysis.cryptomonkeys.cc/script.js"
          data-website-id="45764ebd-2e9a-479a-b615-5c2192481605"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}