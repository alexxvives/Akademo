'use client';

import { useState } from 'react';

interface ContactSectionProps {
  lang: 'es' | 'en';
}

const FAQ_ITEMS = {
  es: [
    { q: '¿Cómo funciona la protección anti-compartir?', a: 'Cada estudiante solo puede tener una sesión activa. Si alguien inicia sesión desde otro dispositivo, la sesión anterior se cierra automáticamente.' },
    { q: '¿Qué pasa si un estudiante graba la pantalla?', a: 'Cada vídeo muestra una marca de agua dinámica con el nombre y email del estudiante, permitiendo identificar quién lo grabó.' },
    { q: '¿Hay límite de vídeos o estudiantes?', a: 'Depende del plan. El plan gratuito incluye funcionalidades básicas. Los planes de pago ofrecen almacenamiento ilimitado.' },
    { q: '¿Cómo funcionan las clases en directo?', a: 'Se integra con Zoom. Puedes programar y lanzar clases en directo desde el panel. Las sesiones se graban automáticamente.' },
    { q: '¿Puedo migrar desde otra plataforma?', a: 'Sí. Nuestro equipo te ayuda con la migración de contenido y estudiantes. Escríbenos para un plan personalizado.' },
    { q: '¿Es seguro el pago?', a: 'Los pagos se procesan a través de Stripe, el procesador de pagos más seguro del mundo.' },
  ],
  en: [
    { q: 'How does anti-sharing protection work?', a: 'Each student can only have one active session. If someone logs in from another device, the previous session is automatically closed.' },
    { q: 'What if a student records the screen?', a: 'Each video shows a dynamic watermark with the student\'s name and email, allowing you to identify who recorded it.' },
    { q: 'Is there a limit on videos or students?', a: 'It depends on the plan. The free plan includes basic features. Paid plans offer unlimited storage.' },
    { q: 'How do live classes work?', a: 'It integrates with Zoom. You can schedule and launch live classes from the dashboard. Sessions are automatically recorded.' },
    { q: 'Can I migrate from another platform?', a: 'Yes. Our team helps with content and student migration. Contact us for a personalized plan.' },
    { q: 'Is payment secure?', a: 'Payments are processed through Stripe, the world\'s most secure payment processor.' },
  ],
};

export function ContactSection({ lang }: ContactSectionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqItems = FAQ_ITEMS[lang];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: FAQ */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {lang === 'es' ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {lang === 'es' ? 'Todo lo que necesitas saber sobre AKADEMO.' : 'Everything you need to know about AKADEMO.'}
            </p>
            <div className="space-y-2">
              {faqItems.map((faq, i) => (
                <div key={i} className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-800 text-sm pr-4">{faq.q}</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-3.5 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                      <div className="pt-3">{faq.a}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Contact form */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {lang === 'es' ? 'Hablemos' : "Let's Talk"}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {lang === 'es' 
                ? 'Si diriges una academia y te importa tu contenido, deberíamos conversar.'
                : "If you run an academy and care about your content, we should talk."}
            </p>
            
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'es' ? 'Nombre' : 'Name'}
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder={lang === 'es' ? 'Tu nombre' : 'Your name'}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'es' ? 'Email' : 'Email'}
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder={lang === 'es' ? 'tu@email.com' : 'your@email.com'}
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'es' ? 'Mensaje' : 'Message'}
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm"
                  placeholder={lang === 'es' ? 'Cuéntanos sobre tu academia...' : 'Tell us about your academy...'}
                />
              </div>
              
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors text-sm"
              >
                {lang === 'es' ? 'Enviar Mensaje' : 'Send Message'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400 mb-2">
                {lang === 'es' ? 'O escríbenos directamente a' : 'Or email us directly at'}
              </p>
              <a 
                href="mailto:contact@akademo.com"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors text-sm"
              >
                contact@akademo.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
