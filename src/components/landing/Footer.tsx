'use client';

import Link from 'next/link';
import Image from 'next/image';

// Footer component
interface FooterTranslations {
  footerTagline: string;
}

interface FooterProps {
  t: FooterTranslations;
  lang: 'es' | 'en';
}

export function Footer({ t, lang }: FooterProps) {
  return (
    <footer className="py-16 px-4 sm:px-6 bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image src="/logo/AKADEMO_logo_OTHER2.svg" alt="AKADEMO" width={32} height={32} className="h-7 w-auto brightness-0 invert" />
              <span className="font-bold text-white text-lg tracking-tight">AKADEMO</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">{t.footerTagline}</p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{lang === 'es' ? 'Producto' : 'Product'}</h4>
            <ul className="space-y-2">
              <li><Link href="/pricing" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Precios' : 'Pricing'}</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-white text-sm transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacidad" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Privacidad' : 'Privacy'}</Link></li>
              <li><Link href="/terminos" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Términos' : 'Terms'}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">© {new Date().getFullYear()} AKADEMO. {lang === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}</p>
            <a href="mailto:alex@akademo-edu.com" className="text-gray-400 hover:text-white text-sm transition-colors">
              alex@akademo-edu.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
