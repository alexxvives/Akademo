import { BlogPageWrapper } from '@/components/blog/BlogPageWrapper';

export default function ZoomDocsLayout({ children }: { children: React.ReactNode }) {
  return <BlogPageWrapper>{children}</BlogPageWrapper>;
}
