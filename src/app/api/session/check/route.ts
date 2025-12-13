import { sessionQueries } from '@/lib/db';
import { requireRole, getSession } from '@/lib/auth';
import { generateDeviceFingerprint, getClientIP } from '@/lib/device-fingerprint';
import { handleApiError, successResponse } from '@/lib/api-utils';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    
    if (!session) {
      return Response.json(successResponse({ valid: false }));
    }

    const userAgent = request.headers.get('user-agent') || '';
    const ip = getClientIP(request);
    const fingerprint = generateDeviceFingerprint(userAgent, ip);

    // For students, enforce single active session
    if (session.role === 'STUDENT') {
      // Deactivate all other sessions and create/update current one
      await sessionQueries.deactivateOthers(session.id, fingerprint.fingerprint);
      await sessionQueries.upsert(session.id, fingerprint.fingerprint, {
        userAgent: fingerprint.userAgent,
        browser: fingerprint.browser,
        os: fingerprint.os,
      });
    }

    return Response.json(
      successResponse({
        valid: true,
        deviceFingerprint: fingerprint.fingerprint,
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    
    if (!session) {
      return Response.json(successResponse({ valid: false }));
    }

    // Only enforce single device for students
    if (session.role === 'STUDENT') {
      const userAgent = request.headers.get('user-agent') || '';
      const ip = getClientIP(request);
      const fingerprint = generateDeviceFingerprint(userAgent, ip);

      // Check if this device has an active session
      const deviceSession = await sessionQueries.findByUserAndFingerprint(session.id, fingerprint.fingerprint) as any;

      if (!deviceSession || !deviceSession.isActive) {
        return Response.json(
          successResponse({
            valid: false,
            message: 'Your session has been terminated because you logged in from another device.',
          })
        );
      }
    }

    return Response.json(successResponse({ valid: true }));
  } catch (error) {
    return handleApiError(error);
  }
}
