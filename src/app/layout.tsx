import type { Metadata } from "next";
import { Montserrat } from 'next/font/google';
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
  title: "AKADEMO - Plataforma de Aprendizaje Seguro",
  description: "Gestiona clases, profesores, estudiantes y Clases de video protegidas",
  icons: {
    icon: '/logo/AKADEMO_favicon.ico',
    shortcut: '/logo/AKADEMO_favicon.ico',
    apple: '/logo/AKADEMO_favicon.ico',
  },
  openGraph: {
    title: "AKADEMO - Plataforma de Aprendizaje Seguro",
    description: "Gestiona clases, profesores, estudiantes y Clases de video protegidas",
    images: ['/logo/akademo_logo_B.svg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={montserrat.variable}>
      <head>
        <meta name="theme-color" content="#111318" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
