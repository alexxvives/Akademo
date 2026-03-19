import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/lib/blog-data';

export function BlogLayout({ post, children }: { post: BlogPost; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/logo/AKADEMO_logo_OTHER2.svg" alt="AKADEMO" width={28} height={28} className="h-6 w-auto brightness-0 invert" />
            <span className="font-bold text-lg tracking-tight">AKADEMO</span>
          </Link>
          <Link href="/blog" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Blog
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <article>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4 text-sm">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                {post.category}
              </span>
              <time className="text-gray-400" dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
              <span className="text-gray-400">· {post.readTime}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
              {post.title}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              {post.description}
            </p>
          </div>
          <div className="prose prose-gray prose-lg max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline">
            {children}
          </div>
        </article>

        {/* CTA */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-8 sm:p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">¿Listo para proteger tu academia?</h2>
          <p className="text-indigo-100 mb-6 max-w-lg mx-auto">
            AKADEMO te da las herramientas para proteger tu contenido, gestionar tu equipo y hacer crecer tu academia.
          </p>
          <Link href="/?modal=register" className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors">
            Solicitar Demo Gratuita
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} AKADEMO. Todos los derechos reservados.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">Inicio</Link>
            <Link href="/blog" className="text-gray-500 hover:text-gray-900 transition-colors">Blog</Link>
            <Link href="/pricing" className="text-gray-500 hover:text-gray-900 transition-colors">Precios</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
