import Link from 'next/link';
import { BlogPost } from '@/lib/blog-data';

export function BlogLayout({ post, children }: { post: BlogPost; children: React.ReactNode }) {
  return (
    <>
      {/* Hero section — dark like landing page */}
      <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 overflow-hidden bg-gray-950">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-gray-950 to-gray-950 pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al Blog
          </Link>
          <div className="flex items-center gap-3 mb-4 text-sm">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300">
              {post.category}
            </span>
            <time className="text-gray-500" dateTime={post.date}>
              {new Date(post.date).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
            <span className="text-gray-500">· {post.readTime}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            {post.description}
          </p>
        </div>
      </section>

      {/* Article content */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <article className="max-w-3xl mx-auto">
          <div className="prose prose-gray prose-lg max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-p:leading-relaxed">
            {children}
          </div>
        </article>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-8 sm:p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">¿Listo para proteger tu academia?</h2>
          <p className="text-indigo-100 mb-6 max-w-lg mx-auto">
            AKADEMO te da las herramientas para proteger tu contenido, gestionar tu equipo y hacer crecer tu academia.
          </p>
          <Link href="/?modal=register" className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors">
            Solicitar Demo Gratuita
          </Link>
        </div>
      </section>

      {/* Related articles */}
      <section className="py-8 pb-16 px-4 sm:px-6 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">¿Quieres seguir leyendo?</p>
            <Link href="/blog" className="text-sm font-medium text-indigo-600 hover:underline">
              Ver todos los artículos →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
