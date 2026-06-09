import ArticleClientSlug from "./ArticleClientSlug";

export default async function ArticleSlugPage({ params }) {
  const { slug } = await params;
  return <ArticleClientSlug slug={slug} />;
}
