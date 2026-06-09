import ArticleClient from "./ArticleClient";

export default async function ArticlePage({ params }) {
  const { params: segments } = await params;

  // Slug route: /article/YYYY/MM/DD/slug  (4 segments)
  if (segments.length === 4) {
    const slug = segments[3];
    return <ArticleClient fetchUrl={`https://api.techsentiments.com/article/slug/${slug}`} />;
  }

  // UUID route: /article/UUID  (1 segment)
  const id = segments[0];
  return <ArticleClient fetchUrl={`https://api.techsentiments.com/article/${id}`} />;
}
