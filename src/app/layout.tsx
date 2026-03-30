import type { Metadata } from "next";
import { Montserrat } from 'next/font/google';
import Script from 'next/script';
import "./globals.css";

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://akademo-edu.com'),
  title: "AKADEMO - Software de Gestión para Academias | Protección de Contenido",
  description: "Plataforma todo-en-uno para academias online: protege vídeos con marca de agua, evita cuentas compartidas, gestiona profesores, estudiantes y clases en directo. Software para academias y centros de formación.",
  keywords: [
    'software para academias',
    'plataforma educativa',
    'gestión de academias',
    'seguridad academia online',
    'plataforma segura para academias',
    'protección de contenido educativo',
    'marca de agua vídeos',
    'anti-piratería educación',
    'gestión de estudiantes',
    'clases online protegidas',
    'plataforma de aprendizaje',
    'software centros de formación',
    'LMS seguro',
    'academia online',
    'evitar piratería academias',
    'control acceso estudiantes',
    'seguridad plataforma educativa',
    'software seguro academia',
    'proteger vídeos educativos',
  ],
  alternates: {
    canonical: 'https://akademo-edu.com',
    languages: {
      'es': 'https://akademo-edu.com',
    },
  },
  icons: {
    icon: '/logo/AKADEMO_favicon.ico',
    shortcut: '/logo/AKADEMO_favicon.ico',
    apple: '/logo/AKADEMO_favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://akademo-edu.com',
    siteName: 'AKADEMO',
    title: "AKADEMO - Software de Gestión para Academias | Protección de Contenido",
    description: "Protege tu contenido educativo, evita cuentas compartidas y gestiona tu academia online desde una sola plataforma.",
    images: [
      {
        url: '/logo/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'AKADEMO - Software de Gestión para Academias',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "AKADEMO - Software de Gestión para Academias",
    description: "Protege tu contenido educativo, evita cuentas compartidas y gestiona tu academia online.",
    images: ['/logo/og-image.svg'],
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  }),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={montserrat.variable}>
      <head>
        <meta name="theme-color" content="#111318" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.akademo-edu.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  name: 'AKADEMO',
                  url: 'https://akademo-edu.com',
                  logo: 'https://akademo-edu.com/logo/AKADEMO_logo_OTHER2.svg',
                  description: 'Plataforma de gestión y protección de contenido para academias online.',
                  contactPoint: {
                    '@type': 'ContactPoint',
                    email: 'alex@akademo-edu.com',
                    contactType: 'sales',
                    availableLanguage: ['Spanish', 'English'],
                  },
                },
                {
                  '@type': 'SoftwareApplication',
                  name: 'AKADEMO',
                  applicationCategory: 'EducationalApplication',
                  operatingSystem: 'Web',
                  url: 'https://akademo-edu.com',
                  description: 'Software de gestión para academias con protección anti-piratería, marca de agua en vídeos, control de cuentas compartidas y gestión de estudiantes.',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'EUR',
                    description: 'Plan gratuito disponible',
                  },
                },
                {
                  '@type': 'FAQPage',
                  mainEntity: [
                    {
                      '@type': 'Question',
                      name: '¿Cómo funciona la protección anti-compartir?',
                      acceptedAnswer: { '@type': 'Answer', text: 'Cada estudiante solo puede tener una sesión activa. Si alguien inicia sesión desde otro dispositivo, la sesión anterior se cierra automáticamente.' },
                    },
                    {
                      '@type': 'Question',
                      name: '¿Qué pasa si un estudiante graba la pantalla?',
                      acceptedAnswer: { '@type': 'Answer', text: 'Cada vídeo muestra una marca de agua dinámica con el nombre y email del estudiante, permitiendo identificar quién lo grabó.' },
                    },
                    {
                      '@type': 'Question',
                      name: '¿Hay límite de vídeos o estudiantes?',
                      acceptedAnswer: { '@type': 'Answer', text: 'Los planes de pago ofrecen almacenamiento ilimitado.' },
                    },
                    {
                      '@type': 'Question',
                      name: '¿Cómo funcionan las clases en directo?',
                      acceptedAnswer: { '@type': 'Answer', text: 'Se integra con Zoom. Puedes programar y lanzar clases en directo desde el panel. Las sesiones se graban automáticamente y tienen una marca de agua con el nombre y email del estudiante.' },
                    },
                    {
                      '@type': 'Question',
                      name: '¿Puedo migrar desde otra plataforma?',
                      acceptedAnswer: { '@type': 'Answer', text: 'Sí. Nuestro equipo te ayuda con la migración de contenido y estudiantes.' },
                    },
                    {
                      '@type': 'Question',
                      name: '¿Se pueden procesar los pagos de los estudiantes?',
                      acceptedAnswer: { '@type': 'Answer', text: 'Sí, ofrecemos una integración con Stripe para una gestión automática de los pagos o un seguimiento manual si se prefieren pagos en efectivo, bizum o transferencia bancaria.' },
                    },
                  ],
                },
              ],
            }),
          }}
        />
      </head>
      <body className="antialiased overflow-x-hidden">
        <main>{children}</main>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
