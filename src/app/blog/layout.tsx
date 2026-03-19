import { BlogPageWrapper } from '@/components/blog/BlogPageWrapper';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <BlogPageWrapper>{children}</BlogPageWrapper>;
}
