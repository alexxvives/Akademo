interface SendEmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
}

export async function sendEmail(
  env: { MAILEROO_API_KEY?: string },
  options: SendEmailOptions,
): Promise<boolean> {
  const { to, from = 'AKADEMO <noreply@akademo-edu.com>', subject, html } = options;
  const toList = Array.isArray(to) ? to : [to];

  if (!env.MAILEROO_API_KEY) {
    console.warn('[sendEmail] MAILEROO_API_KEY not configured');
    return false;
  }

  try {
    const params = new URLSearchParams({ from, to: toList.join(', '), subject, html });
    const res = await fetch('https://smtp.maileroo.com/send', {
      method: 'POST',
      headers: {
        'X-API-Key': env.MAILEROO_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('[sendEmail] Maileroo error:', res.status, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[sendEmail] Maileroo exception:', err);
    return false;
  }
}
