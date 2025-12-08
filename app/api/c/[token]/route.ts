import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { nip57, nip19, finalizeEvent } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';

interface ParsedToken {
  aud: string;
  callback: string;
  msats?: number;
  price?: string;
  unit?: string;
  triggerId?: string;
  lnurl: string;
  relays: string[];
  pubkey: string;
};

let privateKeyBytes: Uint8Array | undefined;
const privateKeyString = process.env.NOSTR_PRIVATE_KEY;
if (privateKeyString) {
  if (privateKeyString.startsWith('nsec')) {
    const decoded = nip19.decode(privateKeyString).data;
    privateKeyBytes = decoded instanceof Uint8Array ? decoded : hexToBytes(decoded as string);
  } else {
    privateKeyBytes = hexToBytes(privateKeyString);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const amountString = searchParams.get('amount');
    const { token } = await params;

    // Validate token exists
    if (!token) {
      return NextResponse.json({ status: 'ERROR', reason: 'Token is required' }, { status: 400 });
    }

    if (!amountString) {
      return NextResponse.json({ status: 'ERROR', reason: 'Amount query-parameter is required' }, { status: 400 });
    }
    const amount = Number.parseInt(amountString);
    if (amount <= 0 || !Number.isSafeInteger(amount)) {
      return NextResponse.json({ status: 'ERROR', reason: 'Amount must be a valid positive integer' }, { status: 400 });
    }

    let parsedToken: ParsedToken;
    try {
      const { payload } = await jwtVerify<ParsedToken>(token, new TextEncoder().encode(process.env.JWT_SECRET), {
        algorithms: ['HS256'],
        audience: 'lnurlp-callback',
      });
      parsedToken = payload as ParsedToken;
    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json({ status: 'ERROR', reason: 'Invalid or expired token' }, { status: 400 });
    }

    if (parsedToken.msats !== undefined && parsedToken.msats !== amount) {
      if (amount % 1000 === 0 && [Math.ceil(parsedToken.msats / 1000) * 1000, Math.floor(parsedToken.msats / 1000) * 1000].includes(amount)) {
        return NextResponse.json({ status: 'ERROR', reason: 'Your wallet does not support millisats' }, { status: 400 });
      } else {
        console.warn(`Amount does not match the token: ${parsedToken.msats} !== ${amount}`);
        return NextResponse.json({ status: 'ERROR', reason: 'Amount does not match the token' }, { status: 400 });
      }
    }

    if (!privateKeyBytes) {
      throw new Error('NOSTR_PRIVATE_KEY environment variable not configured');
    }

    // Create zap-request event
    const zapRequestEvent = nip57.makeZapRequest({
      profile: parsedToken.pubkey,
      event: null,
      amount,
      relays: parsedToken.relays,
      comment: JSON.stringify({
        ...(parsedToken.triggerId !== undefined) && {
          triggerId: parsedToken.triggerId,
        },
        ...(parsedToken.price !== undefined && parsedToken.unit !== undefined) && {
          price: parsedToken.price,
          unit: parsedToken.unit,
        },
      }),
    });

    zapRequestEvent.tags.push(['lnurl', parsedToken.lnurl]);

    // Sign the event
    const signedZapRequest = finalizeEvent(zapRequestEvent, privateKeyBytes);

    const callbackUrl = new URL(parsedToken.callback);
    callbackUrl.searchParams.set('amount', `${amount}`);
    callbackUrl.searchParams.set('nostr', JSON.stringify(signedZapRequest));
    callbackUrl.searchParams.set('lnurl', parsedToken.lnurl);

    const callbackResponse = await fetch(callbackUrl.toString());
    const callbackResponseBody = await callbackResponse.json();

    return NextResponse.json(callbackResponseBody, {
      status: callbackResponse.status,
    });

  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ status: "ERROR", reason: 'Internal server error' }, { status: 500 });
  }
}
