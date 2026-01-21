export default async function sitemap() {
  const baseUrl = 'https://techsentiments.com';
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Fetch all articles from API
  let articles = [];
  try {
    // Fetch recent articles (adjust limit as needed)
    const res = await fetch('https://api.techsentiments.com/articles/all?limit=10000', {
      cache: 'no-store',
    });
    const json = await res.json();
    articles = json.articles || [];
  } catch (error) {
    console.error('Error fetching articles for sitemap:', error);
  }

  // Generate article URLs
  const articlePages = articles.map((article) => ({
    url: `${baseUrl}/article/${article.id}`,
    lastModified: article.published_at ? new Date(article.published_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticPages, ...articlePages];
}