import { Hono } from 'hono';
import { requireAuth } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const zoom = new Hono();

// Generate Zoom SDK signature for joining meetings
zoom.post('/signature', async (c) => {
  try {
    const session = await requireAuth(c);
    const { meetingNumber, role } = await c.req.json();

    if (!meetingNumber) {
      return c.json(errorResponse('Meeting number is required'), 400);
    }

    // role: 0 = participant, 1 = host
    const sdkKey = c.env.ZOOM_CLIENT_ID;
    const sdkSecret = c.env.ZOOM_CLIENT_SECRET;

    if (!sdkKey || !sdkSecret) {
      return c.json(errorResponse('Zoom SDK credentials not configured'), 500);
    }

    const timestamp = new Date().getTime() - 30000;
    
    // Use Web Crypto API (Cloudflare Workers compatible)
    const encoder = new TextEncoder();
    const msgString = sdkKey + meetingNumber + timestamp + role;
    const msgBase64 = btoa(msgString);
    
    // Create HMAC-SHA256 hash
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(sdkSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const hashBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(msgBase64)
    );
    
    // Convert hash to base64
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));
    
    // Create final signature
    const signatureString = `${sdkKey}.${meetingNumber}.${timestamp}.${role}.${hashBase64}`;
    const signature = btoa(signatureString);

    return c.json(successResponse({
      signature,
      sdkKey,
    }));
  } catch (error: any) {
    console.error('[Zoom Signature] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default zoom;
