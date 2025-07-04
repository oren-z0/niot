"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { nip19 } from "nostr-tools";
import { bech32 } from "bech32";
import { QRCodeCanvas } from "qrcode.react";
import Link from "next/link";

const maxSafePrice = 2 ** 43;

const niotNpub = "npub1cyjewcsx6ze7ulvgumsuk9k26zkuj3ngjzc48y8s4rc3h5jf89vq33zhpt";
const niotProfilePage = "https://njump.me/nprofile1qqsvzfvhvgrdpvlw0kywdcwtzm9dptwfge5fpv2njrc23ugm6fynjkqpzpmhxue69uhkummnw3ezumt0d5hszrnhwden5te0dehhxtnvdakz7qgawaehxw309ahx7um5wghxy6t5vdhkjmn9wgh8xmmrd9skctcv3dg7c";

function hexToBase64(hex: string) {
  const pubkeyBytes = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
  return btoa(String.fromCharCode(...pubkeyBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const PayToZap = () => {
  const [nprofile, setNprofile] = useState("");
  const [parsedNprofile, setParsedNprofile] = useState<{ pubkey: string, relays: string[] } | undefined>(undefined);
  const [nprofileError, setNprofileError] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("sats");
  const [triggerId, setTriggerId] = useState("");
  const [copiedLnurl, setCopiedLnurl] = useState(false);
  const [copiedNiotNpub, setCopiedNiotNpub] = useState(false);

  const lnurlp = useMemo(() => {
    if (!parsedNprofile) {
      return undefined;
    }
    const targetUrl = new URL(`${window.location.protocol}//${window.location.host}/api/p`);
    targetUrl.searchParams.set('pk', hexToBase64(parsedNprofile.pubkey));
    for (const relay of parsedNprofile.relays) {
      if (relay.startsWith('wss://')) {
        targetUrl.searchParams.append('w', relay.slice('wss://'.length));
      } else {
        targetUrl.searchParams.append('r', relay);
      }
    }
    const finalPrice = Number(price || '0');
    if (finalPrice > 0 && !Number.isNaN(finalPrice)) {
      targetUrl.searchParams.set('p', finalPrice.toString());
      if (unit !== 'sats') {
        targetUrl.searchParams.set('u', unit);
      }
    }
    if (triggerId) {
      targetUrl.searchParams.set('i', triggerId);
    }
    console.info(`parsed lnurl: ${targetUrl.toString()}`);
    const words = bech32.toWords(new TextEncoder().encode(targetUrl.toString()));
    return bech32.encode('lnurl', words, Number.MAX_SAFE_INTEGER).toUpperCase();
  }, [parsedNprofile, price, unit, triggerId]);

  useEffect(() => {
    if (copiedLnurl) {
      const timeout = setTimeout(() => setCopiedLnurl(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copiedLnurl]);

  useEffect(() => {
    if (copiedNiotNpub) {
      const timeout = setTimeout(() => setCopiedNiotNpub(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copiedNiotNpub]);

  function updateNprofile(e: React.ChangeEvent<HTMLInputElement>) {
    setNprofile(e.target.value);
    const value = e.target.value.toLowerCase().trim();
    if (value.length === 0) {
      setNprofileError("nprofile is required");
      setParsedNprofile(undefined);
      return;
    }
    if (value.startsWith("npub")) {
      setNprofileError("We need the nprofile (that contains both your public-key and relay hints), not the npub.");
      setParsedNprofile(undefined);
      return;
    }
    if ("nprofile".startsWith(value)) {
      setNprofileError("");
      setParsedNprofile(undefined);
      return;
    }
    try {
      const decoded = nip19.decode(value);
      if (decoded.type !== "nprofile") {
        setNprofileError("Invalid nprofile");
        setParsedNprofile(undefined);
        return;
      }
      setParsedNprofile({ pubkey: decoded.data.pubkey, relays: decoded.data.relays });
      setNprofileError("");
    } catch (error) {
      setNprofileError("Invalid nprofile");
      setParsedNprofile(undefined);
    }
  }

  function onPriceUpdate(e: React.ChangeEvent<HTMLInputElement>, isBlur: boolean) {
    const { value } = e.target;
    if (value.trim().length === 0) {
      setPrice("");
      return;
    }
    const newPrice = Math.max(0, Number(Number(value).toFixed(2)) || 0);
    if (newPrice <= 0) {
      if (isBlur) {
        setPrice("");
      } else {
        setPrice(value);
      }
      return;
    }
    if (newPrice > maxSafePrice) {
      if (isBlur) {
        setPrice("");
      } else {
        setPrice(maxSafePrice.toString());
      }
      return;
    }
    setPrice(newPrice.toString());
  }

  return (
    <section className="container mx-auto px-4 py-12 bg-gray-100 dark:bg-gray-900 duration-200 rounded-xl opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center flex flex-col">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-4">
            Every Payment Becomes a <span className="italic">Zap</span>
          </h2>
          <p className="mt-8 text-xl text-gray-600 dark:text-gray-300 font-light">
            Create LNURL-Pay links that create <span className="italic">Zap</span> events when paid.
          </p>
          <p className="text-xl text-gray-600 dark:text-gray-300 font-light">
            Zaps will come from the following profile:
          </p>
          <div className="flex justify-center items-center mt-4">
            <Link href={niotProfilePage} target="_blank" rel="noopener noreferrer">
              <Image
                width={128}
                height={128}
                src="/images/avatar.png"
                alt="Profile Avatar"
                className="rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
              />
            </Link>
          </div>
          <div className="flex flex-row justify-center items-center mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-light font-mono break-all text-left">
              {niotNpub}
            </p>
            <button
              type="button"
              disabled={copiedNiotNpub}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(niotNpub);
                  setCopiedNiotNpub(true);
                } catch (err) {
                  console.error('Failed to copy text: ', err);
                }
              }}
              className="ml-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[80px]"
            >
              {copiedNiotNpub ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        <div className="mt-10">
        <form className="max-w-2xl mx-auto space-y-6">
          {/* nprofile field */}
          <div>
            <label htmlFor="nprofile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enter your nprofile:
            </label>
            <input
              type="text"
              id="nprofile"
              name="nprofile"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="nprofile1..."
              value={nprofile}
              onChange={updateNprofile}
              onBlur={(e) => {
                if (e.target.value.trim().length === 0) {
                  setNprofileError("Nprofile is required");
                  setParsedNprofile(undefined);
                }
              }}
            />
            {nprofileError && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{nprofileError}</p>}
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                id="price"
                name="price"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder=""
                step={0.01}
                min={0.01}
                max={maxSafePrice}
                value={price}
                onChange={(e) => onPriceUpdate(e, false)}
                onBlur={(e) => onPriceUpdate(e, true)}
              />
              <select
                id="unit"
                name="unit"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="sats">sats</option>
                <option value="USD">dirty USD</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="triggerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trigger ID (optional)
            </label>
            <input
              type="text"
              id="triggerId"
              name="triggerId"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Digits only..."
              value={triggerId}
              onChange={(e) => {
                const value = e.target.value.trim();
                if (value.length > 25 || !/^[0-9]*$/.test(value)) {
                  return;
                }
                setTriggerId(value);
              }}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Will be added to each zap event content to allow separation between IoT triggers, up to 25 characters.
            </p>
          </div>
          {
            lnurlp && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                  LNURL-Pay Endpoint
                </label>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-sm text-gray-800 dark:text-gray-200 break-all bg-white dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-600 flex-1">
                    {lnurlp}
                  </div>
                  <button
                    type="button"
                    disabled={copiedLnurl}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(lnurlp);
                        setCopiedLnurl(true);
                      } catch (err) {
                        console.error('Failed to copy text: ', err);
                      }
                    }}
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[80px]"
                  >
                    {copiedLnurl ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="mt-8 mb-4 flex justify-center">
                  <QRCodeCanvas value={lnurlp} marginSize={4} size={256} />
                </div>
              </div>
            )
          }
        </form>
        </div>
      </div>
    </section>
  );
};

export default PayToZap;
