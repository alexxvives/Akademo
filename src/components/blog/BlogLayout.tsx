import Link from 'next/link';
import { BlogPost } from '@/lib/blog-data';

function TableOfContents({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8 my-10">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Contenido</h2>
      <ol className="space-y-2.5">
        {items.map((item, i) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="flex items-start gap-3 text-[15px] text-gray-700 hover:text-indigo-600 transition-colors group"
            >
              <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                {i + 1}
              </span>
              <span className="leading-snug">{item.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function BlogLayout({ post, children }: { post: BlogPost; children: React.ReactNode }) {
  const ogImage = `/api/og?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category)}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.image || `https://akademo-edu.com${ogImage}`,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: 'AKADEMO', url: 'https://akademo-edu.com' },
    publisher: { '@type': 'Organization', name: 'AKADEMO', url: 'https://akademo-edu.com' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://akademo-edu.com/blog/${post.slug}` },
    keywords: post.keywords.join(', '),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero section — dark like landing page */}
      <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 overflow-hidden bg-gray-950">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-gray-950 to-gray-950 pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
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
          <p className="text-lg text-gray-400 leading-relaxed max-w-3xl">
            {post.description}
          </p>
        </div>
      </section>

      {/* Featured image */}
      <div className="px-4 sm:px-6 bg-gray-950 pb-0">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-2xl translate-y-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.image}
              alt={post.imageAlt}
              width={1200}
              height={630}
              className="w-full h-[300px] sm:h-[400px] object-cover block"
              loading="eager"
            />
          </div>
        </div>
      </div>

      {/* Article content */}
      <section className="pt-16 pb-12 sm:pb-16 px-4 sm:px-6">
        <article className="max-w-4xl mx-auto">
          {/* Table of Contents */}
          {post.toc && post.toc.length > 0 && <TableOfContents items={post.toc} />}

          <div className="blog-content prose prose-gray prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-p:leading-relaxed prose-p:text-gray-600 prose-li:text-gray-600 prose-img:rounded-xl prose-img:shadow-lg prose-h2:text-2xl prose-h2:mt-14 prose-h2:mb-5 prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-200 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-h3:pl-4 prose-h3:border-l-4 prose-h3:border-indigo-500 prose-ul:my-5 prose-li:my-1">
            {children}
          </div>
        </article>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-8 sm:p-10 text-center text-white">
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
        <div className="max-w-4xl mx-auto">
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
