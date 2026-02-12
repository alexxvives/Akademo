import { Hono } from 'hono';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const zoom = new Hono();

// Helper: Base64URL encode (JWT standard)
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Helper: Generate JWT signature using Web Crypto API (Cloudflare Workers compatible)
async function generateJwtSignature(
  sdkKey: string,
  sdkSecret: string,
  meetingNumber: string,
  role: number
): Promise<string> {
  const encoder = new TextEncoder();
  
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 2; // 2 hours expiry

  // JWT Header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  // JWT Payload - SDK v5.0+ format
  // CRITICAL: mn must be a STRING (not a number!) per Zoom's sample
  // CRITICAL: Use appKey (not sdkKey) to avoid deprecation warning
  const payload = {
    appKey: sdkKey, // Primary key field for SDK v5.0+
    mn: meetingNumber,  // Keep as string - this is what Zoom expects!
    role: role,
    iat: iat,
    exp: exp,
    tokenExp: exp
  };

  // Encode header and payload
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  // Create HMAC-SHA256 signature using Web Crypto API
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(sdkSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signatureInput)
  );

  // Convert signature to base64url
  // CRITICAL: Use proper binary-to-base64 conversion, NOT String.fromCharCode (breaks for bytes > 127)
  const signatureBytes = new Uint8Array(signatureBuffer);
  let binaryString = '';
  for (let i = 0; i < signatureBytes.length; i++) {
    binaryString += String.fromCharCode(signatureBytes[i]);
  }
  const signatureBase64 = base64UrlEncode(binaryString);

  // Return complete JWT
  return `${headerEncoded}.${payloadEncoded}.${signatureBase64}`;
}

// Generate Zoom SDK signature (JWT) for joining meetings
// SDK v5.0+ requires JWT with appKey field
zoom.post('/signature', async (c) => {
  try {
    const session = await requireAuth(c);
    const { meetingNumber, role = 0 } = await c.req.json();

    if (!meetingNumber) {
      return c.json(errorResponse('Meeting number is required'), 400);
    }

    const sdkKey = c.env.ZOOM_CLIENT_ID;
    const sdkSecret = c.env.ZOOM_CLIENT_SECRET;

    if (!sdkKey || !sdkSecret) {
      console.error('[Zoom Signature] Missing credentials - sdkKey:', !!sdkKey, 'sdkSecret:', !!sdkSecret);
      return c.json(errorResponse('Zoom SDK credentials not configured'), 500);
    }

    // Generate JWT signature for SDK v5.0+
    const signature = await generateJwtSignature(
      sdkKey,
      sdkSecret,
      String(meetingNumber),
      Number(role)
    );

    return c.json(successResponse({
      signature,
      sdkKey,
    }));
  } catch (error: any) {
    console.error('[Zoom Signature] Error:', error);
    return c.json(errorResponse('Internal server error'), 500);
  }
});

export default zoom;
