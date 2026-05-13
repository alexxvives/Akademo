/**
 * send-email-previews.js
 * Sends a sample of every AKADEMO email type to a given address.
 *
 * Usage:
 *   $env:MAILEROO_API_KEY="your_key" ; node scripts/send-email-previews.js [target@email.com]
 */

const TARGET = process.argv[2] || 'alexxvives@gmail.com';
const API_KEY = process.env.MAILEROO_API_KEY;

if (!API_KEY) {
  console.error('ERROR: MAILEROO_API_KEY env var is required.');
  process.exit(1);
}

async function send(subject, html) {
  const params = new URLSearchParams({
    from: 'AKADEMO <onboarding@akademo-edu.com>',
    to: TARGET,
    subject,
    html,
  });
  const res = await fetch('https://smtp.maileroo.com/send', {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const text = await res.text();
  console.log(`[${res.status}] ${subject} → ${TARGET}`);
  if (!res.ok) console.error('  ', text);
}

const ACADEMY = 'Máximo Exponente';
// Replace with a real academy ID from your DB to test the link
const ACADEMY_ID = '93ab97cf-271b-48de-924b-10fb7eab0a38';

const emails = [
  {
    subject: `Recordatorio de pago — ${ACADEMY}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #f8fafc; padding: 24px;">
        <div style="background-color: #0f172a; padding: 32px 40px; border-radius: 12px 12px 0 0;">
          <p style="color: #94a3b8; margin: 0 0 4px 0; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Recordatorio de</p>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">${ACADEMY}</h1>
        </div>
        <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #0f172a; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">Hola, Alex</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">Te recordamos que tienes un pago pendiente para la asignatura <strong style="color: #0f172a;">Análisis Químico</strong> en <strong style="color: #0f172a;">${ACADEMY}</strong>.</p>
          <div style="background-color: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 14px 18px; margin-bottom: 28px;">
            <p style="margin: 0; color: #713f12; font-size: 13px; line-height: 1.5;">Por favor, realiza el pago lo antes posible para mantener tu acceso a los contenidos de la asignatura.</p>
          </div>
          <div style="text-align: center; margin-bottom: 36px;">
            <a href="https://akademo-edu.com/join/academy/${ACADEMY_ID}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 15px; font-weight: 600;">Ir a mi cuenta →</a>
          </div>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0; padding-top: 24px; border-top: 1px solid #f1f5f9;">Saludos,<br><strong style="color: #475569;">Equipo de ${ACADEMY}</strong></p>
        </div>
        <p style="text-align: center; color: #cbd5e1; font-size: 11px; margin: 16px 0 0 0;">Powered by AKADEMO · akademo-edu.com</p>
      </div>
    `,
  },
];

(async () => {
  console.log(`Sending ${emails.length} preview emails to ${TARGET}...\n`);
  for (const email of emails) {
    await send(email.subject, email.html);
    await new Promise(r => setTimeout(r, 400)); // small delay between sends
  }
  console.log('\nDone.');
})();
