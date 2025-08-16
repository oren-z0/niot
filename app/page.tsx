"use client";

import { useEffect } from "react";
import Header from "components/Header";
import Hero from "components/Hero";
import AutoZapper from "components/AutoZapper";
import Footer from "components/Footer";
import SpaceStars from "components/SpaceStars";
import ZapWatcher from "components/ZapWatcher";

export default function Page() {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 100);
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <Header />
      <main className="my-16 flex-grow-1 dark:space-travel-container">
        <SpaceStars />
        <div className="relative z-10 flex flex-col gap-16 justify-around">
          <Hero />
          <AutoZapper />
          <ZapWatcher />
        </div>
      </main>
      <Footer />
    </div>
  );
}
