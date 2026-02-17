"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if consent cookie exists
    const consent = document.cookie
      .split("; ")
      .find((row) => row.startsWith("cookie-consent="));

    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    // Set cookie for 1 year
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `cookie-consent=accepted; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 rounded-lg p-4 shadow-xl">
        <p className="text-sm text-gray-300 mb-3">
          Wir verwenden Cookies, um Ihre Erfahrung zu verbessern.
          Mehr erfahren Sie in unserer{" "}
          <Link href="/datenschutz" className="text-primary hover:underline">
            Datenschutzerklärung
          </Link>.
        </p>
        <Button
          onClick={acceptCookies}
          size="sm"
          variant="outline"
          className="w-full border-white/80 text-white hover:bg-white hover:text-zinc-900"
        >
          Akzeptieren
        </Button>
      </div>
    </div>
  );
}
