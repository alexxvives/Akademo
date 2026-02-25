'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/landing/ScrollReveal';

interface CTASectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
  onOpenModal: (mode: 'login' | 'register', defaultRole?: string) => void;
}

export function CTASection({ t }: CTASectionProps) {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden" style={{ backgroundColor: '#111828' }}>
      <div className="relative max-w-3xl mx-auto text-center">
        <ScrollReveal direction="blur" delay={0}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white mb-6">
            {t.ctaTitleBefore}
            <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent"
            >{t.ctaTitleHighlight}</span>
            {t.ctaTitleAfter}
          </h2>
        </ScrollReveal>
        <p className="text-gray-400 text-lg mb-8">
          {t.ctaSubtitle}
        </p>
        <ScrollReveal direction="zoom" delay={240}>
          <Link
            href="/pricing"
            className="inline-block px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl hover:from-emerald-400 hover:to-cyan-400 font-semibold text-lg transition-all shadow-lg shadow-emerald-500/25"
          >
            {t.ctaButton}
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
