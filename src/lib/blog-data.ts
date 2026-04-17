import type { Metadata } from 'next';

export type { BlogPost } from './blog-data.types';
export { blogPosts } from './blog-posts';

import type { BlogPost } from './blog-data.types';
import { blogPosts } from './blog-posts';

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find(p => p.slug === slug);
}

export function getBlogMetadata(post: BlogPost): Metadata {
  const ogImage = 'https://akademo-edu.com/images/og-image.svg';
  return {
    title: `${post.title} | AKADEMO Blog`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: ['AKADEMO'],
      url: `https://akademo-edu.com/blog/${post.slug}`,
      siteName: 'AKADEMO',
      locale: 'es_ES',
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
    alternates: {
      canonical: `https://akademo-edu.com/blog/${post.slug}`,
    },
  };
}
