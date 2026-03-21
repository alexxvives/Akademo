interface SendEmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
}

/**
 * Send email via Maileroo (preferred) or Resend (fallback).
 * Returns true on success, false on failure.
 */
export async function sendEmail(
  env: { MAILEROO_API_KEY?: string; RESEND_API_KEY?: string },
  options: SendEmailOptions,
): Promise<boolean> {
  const { to, from = 'AKADEMO <noreply@akademo-edu.com>', subject, html } = options;
  const toList = Array.isArray(to) ? to : [to];

  if (env.MAILEROO_API_KEY) {
    try {
      const res = await fetch('https://smtp.maileroo.com/mail/send', {
        method: 'POST',
        headers: {
          'X-API-Key': env.MAILEROO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: toList.join(', '), subject, html_body: html, plain_body: '' }),
      });
      if (!res.ok) {
        console.error('[sendEmail] Maileroo error:', await res.text());
        return false;
      }
      return true;
    } catch (err) {
      console.error('[sendEmail] Maileroo exception:', err);
      return false;
    }
  }

  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: toList, subject, html }),
      });
      if (!res.ok) {
        console.error('[sendEmail] Resend error:', await res.text());
        return false;
      }
      return true;
    } catch (err) {
      console.error('[sendEmail] Resend exception:', err);
      return false;
    }
  }

  console.warn('[sendEmail] No email provider configured (MAILEROO_API_KEY or RESEND_API_KEY)');
  return false;
}
