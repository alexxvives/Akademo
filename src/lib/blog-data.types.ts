export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  keywords: string[];
  image: string;
  imageAlt: string;
  toc?: { id: string; label: string }[];
}
