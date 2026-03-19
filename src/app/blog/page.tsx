import type { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts } from '@/lib/blog-data';

export const metadata: Metadata = {
  title: 'Blog | AKADEMO - Recursos para Academias Online',
  description: 'Artículos sobre protección de contenido educativo, gestión de academias online, marcas de agua en vídeos y estrategias para digitalizar tu academia.',
  keywords: ['blog academias online', 'protección contenido educativo', 'gestión académica', 'software para academias'],
  alternates: {
    canonical: 'https://akademo-edu.com/blog',
  },
};

const categoryIcons: Record<string, string> = {
  'Protección': '🛡️',
  'Seguridad': '🔒',
  'Gestión': '📊',
};

const categoryGradients: Record<string, string> = {
  'Protección': 'from-red-500/10 to-orange-500/10 border-red-200/60',
  'Seguridad': 'from-amber-500/10 to-yellow-500/10 border-amber-200/60',
  'Gestión': 'from-blue-500/10 to-indigo-500/10 border-blue-200/60',
};

const categoryBadge: Record<string, string> = {
  'Protección': 'bg-red-50 text-red-700 ring-red-200',
  'Seguridad': 'bg-amber-50 text-amber-700 ring-amber-200',
  'Gestión': 'bg-blue-50 text-blue-700 ring-blue-200',
};

export default function BlogPage() {
  const featured = blogPosts[0];
  const rest = blogPosts.slice(1);

  return (
    <>
      {/* Hero — minimal and clean */}
      <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 bg-gray-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-gray-950 to-gray-950 pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-indigo-600/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-medium uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Blog &amp; Recursos
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-5">
            Centro de{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Conocimiento
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Guías prácticas, estrategias y recursos para proteger, digitalizar y escalar tu academia online.
          </p>
        </div>
      </section>

      {/* Featured Article */}
      {featured && (
        <section className="px-4 sm:px-6 -mt-2">
          <div className="max-w-6xl mx-auto">
            <Link
              href={`/blog/${featured.slug}`}
              className="group relative block rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 p-[1px] hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300"
            >
              <div className="rounded-3xl bg-gray-950/90 backdrop-blur-sm p-8 sm:p-12 flex flex-col sm:flex-row items-start gap-8">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30">
                      {categoryIcons[featured.category]} {featured.category}
                    </span>
                    <span className="text-xs text-gray-500">{featured.readTime}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold uppercase tracking-wider">
                      Destacado
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-indigo-200 transition-colors mb-3 leading-snug">
                    {featured.title}
                  </h2>
                  <p className="text-gray-400 leading-relaxed mb-5 max-w-xl">
                    {featured.description}
                  </p>
                  <div className="flex items-center gap-4">
                    <time className="text-xs text-gray-500" dateTime={featured.date}>
                      {new Date(featured.date).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </time>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-400 group-hover:text-indigo-300 group-hover:gap-2 transition-all">
                      Leer artículo
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center justify-center w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/5 flex-shrink-0">
                  <span className="text-5xl">{categoryIcons[featured.category] || '📚'}</span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Todos los artículos</h2>
              <p className="text-gray-500 mt-1">{blogPosts.length} publicaciones</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className={`group relative block rounded-2xl border bg-gradient-to-br p-6 sm:p-8 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${categoryGradients[post.category] || 'from-gray-50 to-gray-100 border-gray-200'}`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${categoryBadge[post.category] || 'bg-gray-100 text-gray-700 ring-gray-200'}`}>
                    {categoryIcons[post.category]} {post.category}
                  </span>
                  <div className="text-right flex-shrink-0">
                    <time className="text-xs text-gray-400 block" dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </time>
                    <span className="text-xs text-gray-400">{post.readTime}</span>
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2 leading-snug">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">
                  {post.description}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 group-hover:gap-2 transition-all">
                  Leer más
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            ¿Listo para proteger tu academia?
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
            AKADEMO te da las herramientas para proteger tu contenido, gestionar tu equipo y hacer crecer tu academia online.
          </p>
          <Link
            href="/?modal=register"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
          >
            Solicitar Demo Gratuita
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
