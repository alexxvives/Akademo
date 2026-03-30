import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Precios | AKADEMO - Software para Academias Online',
  description: 'Planes y precios de AKADEMO. Empieza gratis y escala según el número de matriculaciones. Sin costes ocultos. Protección de contenido, gestión de estudiantes y clases en directo incluidas.',
  keywords: [
    'precio software academia online',
    'planes AKADEMO',
    'coste plataforma educativa',
    'software academia precio',
    'LMS seguro precio',
    'plataforma segura academias precio',
  ],
  alternates: {
    canonical: 'https://akademo-edu.com/pricing',
  },
  openGraph: {
    type: 'website',
    url: 'https://akademo-edu.com/pricing',
    title: 'Precios | AKADEMO - Software para Academias Online',
    description: 'Planes y precios de AKADEMO. Empieza gratis y escala según el número de matriculaciones.',
    images: [
      {
        url: '/logo/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'AKADEMO - Precios y Planes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Precios | AKADEMO - Software para Academias Online',
    description: 'Planes y precios de AKADEMO. Empieza gratis y escala según el número de matriculaciones.',
    images: ['/logo/og-image.svg'],
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
