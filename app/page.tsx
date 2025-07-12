"use client";

import Header from "components/Header";
import Hero from "components/Hero";
import PayToZap from "components/PayToZap";
import Footer from "components/Footer";
import SpaceStars from "components/SpaceStars";
import ZapWatcher from "components/ZapWatcher";

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <Header />
      <main className="my-16 flex-grow-1 dark:space-travel-container">
        <SpaceStars />
        <div className="relative z-10 flex flex-col gap-16 justify-around">
          <Hero />
          <PayToZap />
          <ZapWatcher />
        </div>
      </main>
      <Footer />
    </div>
  );
}
