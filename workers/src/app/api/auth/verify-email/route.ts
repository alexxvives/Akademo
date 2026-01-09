import { userQueries } from '@/lib/db';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { z } from 'zod';

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

// This should match the storage in send-verification
// In production, use Redis or similar
const verificationCodes = new Map<string, { code: string; expires: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[Verify Email] Received body:', body);
    
    try {
      const data = verifyEmailSchema.parse(body);
    } catch (validationError: any) {
      console.error('[Verify Email] Validation error:', validationError);
      return errorResponse(`Invalid request: ${validationError.errors?.[0]?.message || 'email and code are required'}`, 400);
    }
    
    const data = verifyEmailSchema.parse(body);

    // Check if code exists
    const stored = verificationCodes.get(data.email);

    if (!stored) {
      return errorResponse('No verification code found. Please request a new one.', 400);
    }

    // Check if expired
    if (Date.now() > stored.expires) {
      verificationCodes.delete(data.email);
      return errorResponse('Verification code expired. Please request a new one.', 400);
    }

    // Check if code matches
    if (stored.code !== data.code) {
      return errorResponse('Invalid verification code', 400);
    }

    // Code is valid - remove it
    verificationCodes.delete(data.email);

    // Mark user as verified (optional - add verified field to User table if needed)
    // const user = await userQueries.findByEmail(data.email);
    // if (user) {
    //   await userQueries.update(user.id, { emailVerified: true });
    // }

    return Response.json(
      successResponse({
        message: 'Email verified successfully',
        verified: true,
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
