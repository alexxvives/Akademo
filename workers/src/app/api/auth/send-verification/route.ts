import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { z } from 'zod';

const sendVerificationSchema = z.object({
  email: z.string().email(),
});

// Store verification codes in memory (in production, use Redis or similar)
const verificationCodes = new Map<string, { code: string; expires: number }>();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = sendVerificationSchema.parse(body);

    // Generate 6-digit code
    const code = generateCode();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store code
    verificationCodes.set(data.email, { code, expires });

    // For testing: log the code
    console.log(`Verification code for ${data.email}: ${code}`);

    // TODO: Send email using Resend or another email service
    // Example with Resend (commented out - needs RESEND_API_KEY in wrangler.toml):
    /*
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'AKADEMO <onboarding@akademo-edu.com>',
            to: [data.email],
            subject: 'Verifica tu email en AKADEMO',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #111827;">Verifica tu email</h1>
                <p>Tu código de verificación es:</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">
                  ${code}
                </div>
                <p style="color: #6b7280; margin-top: 20px;">Este código expira en 10 minutos.</p>
                <p style="color: #6b7280;">Si no solicitaste este código, puedes ignorar este email.</p>
              </div>
            `,
          }),
        });
        
        if (!emailResponse.ok) {
          console.error('Error sending email:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    }
    */

    return Response.json(
      successResponse({
        message: 'Verification code sent',
        // Remove this in production - only for testing:
        code,
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
