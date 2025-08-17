"use client";

import React from "react";
import Link from "next/link";


const NoteGuardian = () => {
  return (
    <section className="container mx-auto px-4 py-12 bg-gray-100 dark:bg-gray-900 duration-200 rounded-xl opacity-90" id="NoteGuardian">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center flex flex-col">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-4">
            NoteGuardian
          </h2>
          <p className="mt-8 text-xl text-gray-600 dark:text-gray-300 font-light">
            A nostr browser extension that relays all the sign/encrypt/decrypt requests to a second device, using WebRTC on local network.
            <br />
            Useful for working on your computer while keeping your private-keys (nsec) only on your phone.
            <br />
            Works well with <Link
              href="https://play.google.com/store/apps/details?id=com.nostr.universe"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors italic"
            >
              Spring app
            </Link> so you can even avoid entering your private-key directly in your phone's browser.
            <br />
            More reliable than nsec-bunkers which communicate over nostr itself,
            but only works if both devices are on the same local network.
          </p>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 font-light">
            Installation instructions for Chrome (not yet available on Chrome Web Store):
          </p>
          <p className="text-xl text-gray-600 dark:text-gray-300 font-light mt-2">
            <Link
              href="https://github.com/oren-z0/noteguardian-extension"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors"
            >
              https://github.com/oren-z0/noteguardian-extension
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default NoteGuardian;
