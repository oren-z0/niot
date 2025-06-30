"use client";

import React, { useEffect, useMemo, useState } from "react";
import { nip19 } from "nostr-tools";
import { bech32 } from "bech32";
import { QRCodeSVG } from "qrcode.react";

const maxSafePrice = 2 ** 43;

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
  const [zapMessage, setZapMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const lnurlp = useMemo(() => {
    if (!parsedNprofile) {
      return undefined;
    }
    const targetUrl = new URL('https://niot.space/api/p');
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
    if (zapMessage) {
      targetUrl.searchParams.set('m', zapMessage);
    }
    const words = bech32.toWords(new TextEncoder().encode(targetUrl.toString()));
    return bech32.encode('lnurl', words, Number.MAX_SAFE_INTEGER).toUpperCase();
  }, [parsedNprofile, price, unit, zapMessage]);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  function updateNprofile(e: React.ChangeEvent<HTMLInputElement>) {
    setNprofile(e.target.value);
    const value = e.target.value.toLowerCase().trim();
    if (value.length === 0) {
      setNprofileError("Nprofile is required");
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
    <section className="container mx-auto px-4 py-12 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 rounded-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-4">
            Every Payment Becomes a <span className="italic">Zap</span>
          </h2>
          <p className="mt-8 text-xl text-gray-600 dark:text-gray-300 font-light">
            Create LNURL-Pay links that create a <span className="italic">Zap</span> event when paid.
          </p>
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
            <label htmlFor="zapMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Zap Message (optional)
            </label>
            <input
              type="text"
              id="zapMessage"
              name="zapMessage"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Digits only..."
              value={zapMessage}
              onChange={(e) => {
                const value = e.target.value.trim();
                if (value.length > 25 || !/^[0-9]*$/.test(value)) {
                  return;
                }
                setZapMessage(value);
              }}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Will be added to each zap event to allow separation between IoT triggers, up to 25 characters.
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
                    disabled={copied}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(lnurlp);
                        setCopied(true);
                      } catch (err) {
                        console.error('Failed to copy text: ', err);
                      }
                    }}
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[80px]"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="mt-8 mb-4 flex justify-center">
                  <QRCodeSVG value={lnurlp} marginSize={4} size={256} />
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
