import type { Metadata } from "next";
import { Montserrat } from 'next/font/google';
import "./globals.css";

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "AKADEMO - Plataforma de Aprendizaje Seguro",
  description: "Gestiona clases, profesores, estudiantes y lecciones de video protegidas",
  icons: {
    icon: '/logo/AKADEMO_favicon.ico',
    shortcut: '/logo/AKADEMO_favicon.ico',
    apple: '/logo/AKADEMO_favicon.ico',
  },
  openGraph: {
    title: "AKADEMO - Plataforma de Aprendizaje Seguro",
    description: "Gestiona clases, profesores, estudiantes y lecciones de video protegidas",
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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
