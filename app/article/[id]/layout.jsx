export async function generateMetadata({ params }) {
  try {
    const res = await fetch(`https://api.techsentiments.com/article/${params.id}`, {
      next: { revalidate: 60 }
    });
    const json = await res.json();
    const article = json.data;

    if (!article) {
      return {
        title: "Article Not Found - Tech Sentiments",
      };
    }

    const hashtags = {
      "AI & ML": "#AI #MachineLearning #Tech",
      "Big Tech": "#BigTech #Tech #Technology",
      "Cybersecurity": "#Cybersecurity #Security #Tech",
      "General Tech": "#Tech #Technology #TechNews",
      "Markets & Finance": "#Finance #Markets #Tech",
      "Startups & VC": "#Startups #VentureCapital #Tech"
    };
    const categoryHashtag = hashtags[article.category] || "#Tech #TechNews";

    return {
      title: `${article.title} - Tech Sentiments`,
      description: article.summary || article.title,
      openGraph: {
        title: article.title,
        description: article.summary || article.title,
        url: `https://techsentiments.com/article/${params.id}`,
        siteName: "Tech Sentiments",
        type: "article",
        images: article.image_url ? [
          {
            url: article.image_url,
            width: 1200,
            height: 630,
            alt: article.title,
          }
        ] : [
          {
            url: "https://techsentiments.com/ts-logo.png",
            width: 512,
            height: 512,
            alt: "Tech Sentiments",
          }
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${article.title} ${categoryHashtag}`,
        description: article.summary || article.title,
        images: article.image_url ? [article.image_url] : ["https://techsentiments.com/ts-logo.png"],
      },
    };
  } catch (error) {
    return {
      title: "Tech Sentiments",
    };
  }
}

export default function ArticleLayout({ children }) {
  return children;
}