"use client";

import React from "react";
import Link from "next/link";


const ZapWatcher = () => {
  return (
    <section className="container mx-auto px-4 py-12 bg-gray-100 dark:bg-gray-900 duration-200 rounded-xl opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center flex flex-col">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-4">
            ZapWatcher
          </h2>
          <p className="mt-8 text-xl text-gray-600 dark:text-gray-300 font-light">
            A versatile ESP32 firmware that activates a pin when a zap is received - with parameters configurable via WiFi Direct.
          </p>
          <p className="text-xl text-gray-600 dark:text-gray-300 font-light mt-2">
            <Link
              href="https://github.com/oren-z0/ZapWatcher"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors"
            >
              https://github.com/oren-z0/ZapWatcher
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ZapWatcher;
