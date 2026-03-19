import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { blogPosts } from '@/lib/blog-data';

export const metadata: Metadata = {
  title: 'Blog | AKADEMO - Recursos para Academias Online',
  description: 'Artículos sobre protección de contenido educativo, gestión de academias online, marcas de agua en vídeos y estrategias para digitalizar tu academia.',
  keywords: ['blog academias online', 'protección contenido educativo', 'gestión académica', 'software para academias'],
  alternates: {
    canonical: 'https://akademo-edu.com/blog',
  },
};

const categoryColors: Record<string, string> = {
  'Protección': 'bg-red-100 text-red-700',
  'Seguridad': 'bg-amber-100 text-amber-700',
  'Gestión': 'bg-blue-100 text-blue-700',
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/logo/AKADEMO_logo_OTHER2.svg" alt="AKADEMO" width={28} height={28} className="h-6 w-auto brightness-0 invert" />
            <span className="font-bold text-lg tracking-tight">AKADEMO</span>
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Blog de AKADEMO
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Recursos, guías y estrategias para proteger tu contenido educativo y gestionar tu academia online de forma eficiente.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              {/* Color header bar */}
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[post.category] || 'bg-gray-100 text-gray-700'}`}>
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-400">{post.readTime}</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2 leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {post.description}
                </p>
                <div className="flex items-center justify-between">
                  <time className="text-xs text-gray-400" dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                  <span className="text-xs font-medium text-indigo-600 group-hover:underline">
                    Leer más →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Simple footer */}
      <footer className="border-t border-gray-200 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} AKADEMO. Todos los derechos reservados.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">Inicio</Link>
            <Link href="/pricing" className="text-gray-500 hover:text-gray-900 transition-colors">Precios</Link>
            <Link href="/privacidad" className="text-gray-500 hover:text-gray-900 transition-colors">Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
