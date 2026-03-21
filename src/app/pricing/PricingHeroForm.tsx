'use client';

import { ScrollReveal } from '@/components/landing/ScrollReveal';
import { RangeSelector } from './PricingIcons';
import type { Lang, PricingTranslations } from './pricing-translations';

interface PricingHeroFormProps {
  t: PricingTranslations;
  lang: Lang;
  form: {
    name: string;
    email: string;
    phone: string;
    academyName: string;
    monthlyEnrollments: string;
    teacherCount: string;
    subjectCount: string;
    message: string;
  };
  updateField: (field: string, value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  error: string;
}

export function PricingHeroForm({ t, lang, form, updateField, handleSubmit, submitting, error }: PricingHeroFormProps) {
  return (
    <section className="relative pt-36 pb-24 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-gray-950 to-gray-950 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="relative max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-stretch">

          {/* LEFT: pitch content */}
          <div className="lg:pt-6 flex flex-col gap-6 justify-between">
            <div>
              <ScrollReveal direction="none" delay={0}>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-5">
                  {t.side.badge}
                </span>
              </ScrollReveal>
              <ScrollReveal direction="blur" delay={80}>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">{t.side.title}</h1>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={160}>
                <p className="text-gray-400 leading-relaxed">{t.side.subtitle}</p>
              </ScrollReveal>
            </div>

            <ul className="space-y-4">
              {t.side.bullets.map((b, i) => (
                <ScrollReveal key={b.title} direction="up" delay={240 + i * 60}>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/40">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{b.title}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
                  </div>
                </li>
                </ScrollReveal>
              ))}
            </ul>

            {/* Social proof mini stats */}
            <ScrollReveal direction="up" delay={480}>
            <div className="mt-2 rounded-2xl border border-gray-800 bg-gradient-to-br from-indigo-950/60 to-gray-900/60 p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">50+</p>
                  <p className="text-xs text-gray-400 mt-0.5">{lang === 'es' ? 'Academias' : 'Academies'}</p>
                </div>
                <div className="border-x border-gray-700/60">
                  <p className="text-2xl font-bold text-white">&lt;24h</p>
                  <p className="text-xs text-gray-400 mt-0.5">{lang === 'es' ? 'Soporte' : 'Support'}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">0€</p>
                  <p className="text-xs text-gray-400 mt-0.5">Setup</p>
                </div>
              </div>
              <p className="text-center text-xs text-gray-500 mt-4 border-t border-gray-800 pt-4">
                {lang === 'es' ? 'Sin permanencia · Migración incluida · Cancela cuando quieras' : 'No lock-in · Migration included · Cancel anytime'}
              </p>
            </div>
            </ScrollReveal>

          </div>

          {/* RIGHT: Form */}
        <ScrollReveal direction="right" delay={160} className="h-full">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 sm:p-10 h-auto lg:h-full">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-8">{t.form.title}</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name + Academy Name */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.form.name} *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder={t.form.namePlaceholder}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.form.academyName}</label>
                <input
                  type="text"
                  value={form.academyName}
                  onChange={(e) => updateField('academyName', e.target.value)}
                  placeholder={t.form.academyNamePlaceholder}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email + Phone */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.form.email} *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder={t.form.emailPlaceholder}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.form.phone}</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder={t.form.phonePlaceholder}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Monthly Enrollments */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">{t.form.monthlyEnrollments}</label>
              <RangeSelector
                options={t.form.ranges.enrollments}
                value={form.monthlyEnrollments}
                onChange={(v) => updateField('monthlyEnrollments', v)}
              />
            </div>

            {/* Teachers */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">{t.form.teacherCount}</label>
              <RangeSelector
                options={t.form.ranges.teachers}
                value={form.teacherCount}
                onChange={(v) => updateField('teacherCount', v)}
              />
            </div>

            {/* Subjects */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">{t.form.subjectCount}</label>
              <RangeSelector
                options={t.form.ranges.subjects}
                value={form.subjectCount}
                onChange={(v) => updateField('subjectCount', v)}
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.form.message}</label>
              <textarea
                value={form.message}
                onChange={(e) => updateField('message', e.target.value)}
                placeholder={t.form.messagePlaceholder}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold text-base hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t.form.submitting : t.form.submit}
            </button>
          </form>
        </div>
        </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
