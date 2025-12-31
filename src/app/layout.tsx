import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AKADEMO - Plataforma de Aprendizaje Seguro",
  description: "Gestiona clases, profesores, estudiantes y lecciones de video protegidas",
  icons: {
    icon: '/logo/akademo_logo_W.svg',
    shortcut: '/logo/akademo_logo_W.svg',
    apple: '/logo/akademo_logo_W.svg',
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
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
