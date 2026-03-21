import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { WebhookEnv } from './types';
import {
  handleMeetingStarted,
  handleMeetingEnded,
  handleRecordingCompleted,
  handleParticipantEvent,
} from './handlers';

// Zoom webhook handler
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const ctx = await getCloudflareContext();
    const env = ctx.env as WebhookEnv;
    const db = env.DB;

    // Handle Zoom URL validation (required for webhook setup)
    if (payload.event === 'endpoint.url_validation') {
      const plainToken = payload.payload.plainToken;
      const secretToken = process.env.ZOOM_WEBHOOK_SECRET || env.ZOOM_WEBHOOK_SECRET || '';

      // Use Web Crypto API
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secretToken),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(plainToken));
      const hashForValidate = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const response = {
        plainToken: plainToken,
        encryptedToken: hashForValidate
      };

      return NextResponse.json(response, { status: 200 });
    }

    const { event, payload: data } = payload;

    // Verify Zoom webhook signature for all non-validation events
    const rawBody = JSON.stringify(payload);
    const reqSignature = request.headers.get('x-zm-signature') || '';
    const timestamp = request.headers.get('x-zm-request-timestamp') || '';
    const secretToken = process.env.ZOOM_WEBHOOK_SECRET || env.ZOOM_WEBHOOK_SECRET || '';

    if (secretToken && timestamp) {
      const message = `v0:${timestamp}:${rawBody}`;
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secretToken),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
      const expectedSig = 'v0=' + Array.from(new Uint8Array(sigBytes))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (reqSignature !== expectedSig) {
        console.error('[Next.js Zoom Webhook] Signature verification failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.error('[Next.js Zoom Webhook] Missing secret or timestamp — rejecting');
      return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
    }

    // Handle different Zoom events
    if (event === 'meeting.started') {
      await handleMeetingStarted(db, data);
    } else if (event === 'meeting.ended') {
      await handleMeetingEnded(db, env, data);
    } else if (event === 'recording.completed') {
      await handleRecordingCompleted(db, env, data);
    } else if (
      event === 'meeting.participant_joined' ||
      event === 'meeting.participant_left' ||
      event === 'participant.joined' ||
      event === 'participant.left'
    ) {
      await handleParticipantEvent(db, data);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: unknown) {
    console.error('[Zoom Webhook] Error:', error);
    // Return 200 even on error to avoid Zoom retries
    return NextResponse.json({ success: true, received: true, error: error instanceof Error ? error.message : String(error) });
  }
}

// Also handle GET for webhook validation test
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'zoom-webhook',
    message: 'Zoom webhook endpoint is active'
  });
}
