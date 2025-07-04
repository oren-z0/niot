import { NextRequest, NextResponse } from 'next/server';
import { SimplePool } from 'nostr-tools';
import * as jose from 'jose';
import { bech32 } from 'bech32';

const btcToSats = 100_000_000;

const priceUnits = new Map<string, string>([
  ['USD', 'BTC-USD'],
]);

function getBaseUrl(request: NextRequest) {
  if (process.env.CUSTOM_DOMAIN) {
    return `https://${process.env.CUSTOM_DOMAIN}`;
  }
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  const protocol = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol;
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host') || request.nextUrl.host;
  return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const publicKeyBase64 = searchParams.get('pk');
    if (!publicKeyBase64 || typeof publicKeyBase64 !== 'string') {
      return NextResponse.json({ status: 'ERROR', reason: 'Invalid public key' }, { status: 400 });
    }
    let publicKeyHex: string;
    try {
      const publicKeyBase64Fixed = publicKeyBase64.replace(/-/g, '+').replace(/_/g, '/') + '=';
      const publicKeyBytes = atob(publicKeyBase64Fixed);
      publicKeyHex = Array.from(publicKeyBytes, byte => byte.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    } catch (error) {
      return NextResponse.json({ status: 'ERROR', reason: 'Invalid pk' }, { status: 400 });
    }
    const relays = [
      ...searchParams.getAll('w').map((v) => `wss://${v}`),
      ...searchParams.getAll('r'),
    ];
    if (relays.length === 0) {
      return NextResponse.json({ status: 'ERROR', reason: 'No relays provided' }, { status: 400 });
    }
    const triggerId = searchParams.get('i') || undefined;
    if (triggerId && (triggerId.length > 25 || !/^\d*$/.test(triggerId))) {
      return NextResponse.json({ status: 'ERROR', reason: 'Invalid zap message' }, { status: 400 });
    }
    let priceMillisats: number | undefined;
    const priceString = searchParams.get('p');
    let priceUnit: string | undefined;
    if (priceString) {
      if (priceString.length > 20 || !/^\d+(\.\d{1,2})?$/.test(priceString)) {
        return NextResponse.json({ status: 'ERROR', reason: 'Invalid price' }, { status: 400 });
      }
      priceUnit = searchParams.get('u') || undefined;
      if (priceUnit) {
        const priceInstrument = priceUnits.get(priceUnit);
        if (!priceInstrument) {
          return NextResponse.json({ status: 'ERROR', reason: 'Invalid price unit' }, { status: 400 });
        }
        const btcPriceResponse = await fetch(`https://data-api.coindesk.com/spot/v1/latest/tick?market=coinbase&instruments=${priceInstrument}&apply_mapping=false`);
        if (!btcPriceResponse.ok) {
          console.error(`Failed to fetch Bitcoin price: ${btcPriceResponse.statusText}`);
          throw new Error("Failed to fetch Bitcoin price");
        }
        const btcPriceData = await btcPriceResponse.json();
        if (!btcPriceData || !btcPriceData.Data || !btcPriceData.Data[priceInstrument] || !Number.isFinite(btcPriceData.Data[priceInstrument].PRICE)) {
          console.error("Failed to parse Bitcoin price");
          throw new Error("Failed to parse Bitcoin price");
        }
        // Rounds millisats - not all wallets support it.
        priceMillisats = Math.max(1, Math.ceil(Number(priceString) * (btcToSats / btcPriceData.Data[priceInstrument].PRICE))) * 1000;
      } else { // unit is sats
        priceMillisats = Math.round(Number(priceString) * 1000);
      }
    }
    console.info(`Searching for nostr profile ${publicKeyHex} in relays: ${JSON.stringify(relays)}`);
    const pool = new SimplePool();
    const event = await pool.get(
      relays,
      {
        authors: [publicKeyHex],
        kinds: [0],
      }
    );
    if (!event) {
      return NextResponse.json({ status: 'ERROR', reason: 'Failed to find nostr profile' }, { status: 400 });
    }
    console.info("parsing nostr profile content");
    const eventContent = JSON.parse(event.content);
    const { lud16 } = eventContent; // TODO: support lud06?
    if (!lud16) {
      return NextResponse.json({ status: 'ERROR', reason: 'No lud16 found in nostr profile' }, { status: 400 });
    }
    const [username, domain] = lud16.split('@');
    const lnurlpUrl = `https://${domain}/.well-known/lnurlp/${username}`;
    console.info(`lnurlpUrl: ${lnurlpUrl}`);
    const lnurlpResponse = await fetch(lnurlpUrl);
    if (!lnurlpResponse.ok) {
      return NextResponse.json({ status: 'ERROR', reason: 'Failed to call lnurlp endpoint' }, { status: 400 });
    }
    const lnurlpBody = await lnurlpResponse.json();
    console.info(`lnurlp response: ${JSON.stringify(lnurlpBody)}`);
    const { tag, allowsNostr, nostrPubkey, minSendable, maxSendable, callback, commentAllowed, ...rest } = lnurlpBody;
    if (tag !== 'payRequest') {
      return NextResponse.json({ status: 'ERROR', reason: "nostr profile's lightning-wallet responded with unexpected tag" }, { status: 400 });
    }
    if (!allowsNostr || !nostrPubkey || nostrPubkey.length !== 64 || !/^[0-9a-fA-F]+$/.test(nostrPubkey)) {
      return NextResponse.json({ status: 'ERROR', reason: 'nostr profile has a lightning-wallet that does not support zaps' }, { status: 400 });
    }
    if (!Number.isSafeInteger(minSendable) || !Number.isSafeInteger(maxSendable)) {
      return NextResponse.json({ status: 'ERROR', reason: 'nostr profile has a wallet with invalid min/max sendable' }, { status: 400 });
    }
    if ((priceMillisats !== undefined) && (priceMillisats < minSendable || priceMillisats > maxSendable)) {
      return NextResponse.json({ status: 'ERROR', reason: 'price is out of range of wallet support' }, { status: 400 });
    }
    if (!commentAllowed || typeof commentAllowed !== 'number' || commentAllowed < 50) {
      return NextResponse.json({ status: 'ERROR', reason: 'nostr profile has a wallet that does not support comments if niot required length' }, { status: 400 });
    }
    const jwt = await new jose.SignJWT({
      aud: 'lnurlp-callback', // the /api/c endpoint.
      callback,
      ...(priceMillisats !== undefined && {
        msats: priceMillisats, // will verify that the same amount is sent to /api/c
        // priceUnit and priceString will be sent in the content of the zap-request event, so the device could verify.
        // Malicious users can generate an LNURLP that uses the same triggerId, but different price - then pay them
        // instead of the original LNURLP.
        ...(priceString && priceUnit && {
          price: priceString, // keep as string even though it's a number
          unit: priceUnit,
        }),
      }),
      ...(triggerId && {
        triggerId,
      }),
      lnurl: bech32.encode('lnurl', bech32.toWords(new TextEncoder().encode(lnurlpUrl)), Number.MAX_SAFE_INTEGER),
      relays,
      pubkey: publicKeyHex,
    }).setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30m')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    return NextResponse.json({
      tag,
      // removed allowNostr, nostrPubkey.
      minSendable,
      maxSendable,
      // removed commentAllowed,
      ...rest,
      ...(priceMillisats !== undefined && {
        minSendable: priceMillisats,
        maxSendable: priceMillisats,
      }),
      callback: `${getBaseUrl(request)}/api/c/${jwt}`,
    });
  } catch (error) {
    console.error('Error in GET request:', error);
    return NextResponse.json({ status: 'ERROR', reason: 'Internal server error' }, { status: 500 });
  }
}
