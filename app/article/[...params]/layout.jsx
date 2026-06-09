// Helper: build the canonical slug URL from an article object, falling back to UUID
function buildCanonicalUrl(article, segments) {
  if (segments.length === 4) {
    return `https://techsentiments.com/article/${segments.join("/")}`;
  }
  if (article.slug && article.published_at) {
    const d = new Date(article.published_at);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `https://techsentiments.com/article/${y}/${mo}/${da}/${article.slug}`;
  }
  return `https://techsentiments.com/article/${segments[0]}`;
}

// Helper: pick the right API URL based on route shape
function buildApiUrl(segments) {
  return segments.length === 4
    ? `https://api.techsentiments.com/article/slug/${segments[3]}`
    : `https://api.techsentiments.com/article/${segments[0]}`;
}

// ─── generateMetadata ────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  const { params: segments } = await params;

  try {
    const res = await fetch(buildApiUrl(segments), {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    const article = json.data;

    if (!article) {
      return { title: "Article Not Found - Tech Sentiments" };
    }

    const canonicalUrl = buildCanonicalUrl(article, segments);

    // Keywords: merge companies + themes arrays if present
    const keywordParts = [
      ...(Array.isArray(article.companies) ? article.companies : []),
      ...(Array.isArray(article.themes) ? article.themes : []),
    ];
    const keywords = keywordParts.length > 0 ? keywordParts.join(", ") : undefined;

    const categoryHashtags = {
      "AI & ML": "#AI #MachineLearning #Tech",
      "Big Tech": "#BigTech #Tech #Technology",
      "Cybersecurity": "#Cybersecurity #Security #Tech",
      "General Tech": "#Tech #Technology #TechNews",
      "Markets & Finance": "#Finance #Markets #Tech",
      "Startups & VC": "#Startups #VentureCapital #Tech",
    };
    const categoryHashtag = categoryHashtags[article.category] || "#Tech #TechNews";

    return {
      title: `${article.title} - Tech Sentiments`,
      description: article.summary || article.title,
      keywords,

      // Canonical URL
      alternates: {
        canonical: canonicalUrl,
      },

      // Robots
      robots: {
        index: true,
        follow: true,
      },

      // Open Graph (includes article:published_time and article:section)
      openGraph: {
        title: article.title,
        description: article.summary || article.title,
        url: canonicalUrl,
        siteName: "Tech Sentiments",
        type: "article",
        publishedTime: article.published_at || undefined,
        section: article.category || undefined,
        images: article.image_url
          ? [{ url: article.image_url, width: 1200, height: 630, alt: article.title }]
          : [{ url: "https://techsentiments.com/ts-logo.png", width: 512, height: 512, alt: "Tech Sentiments" }],
      },

      // Twitter card
      twitter: {
        card: "summary_large_image",
        title: `${article.title} ${categoryHashtag}`,
        description: article.summary || article.title,
        images: article.image_url
          ? [article.image_url]
          : ["https://techsentiments.com/ts-logo.png"],
      },
    };
  } catch {
    return { title: "Tech Sentiments" };
  }
}

// ─── Layout (injects JSON-LD) ─────────────────────────────────────────────────

export default async function ArticleLayout({ children, params }) {
  const { params: segments } = await params;

  let newsArticleJsonLd = null;
  let breadcrumbJsonLd = null;

  try {
    const res = await fetch(buildApiUrl(segments), {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    const article = json.data;

    if (article) {
      const canonicalUrl = buildCanonicalUrl(article, segments);

      const keywordParts = [
        ...(Array.isArray(article.companies) ? article.companies : []),
        ...(Array.isArray(article.themes) ? article.themes : []),
      ];
      const keywords = keywordParts.join(", ");

      // NewsArticle schema
      newsArticleJsonLd = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: article.title,
        description: article.summary || article.title,
        image: article.image_url
          ? [article.image_url]
          : ["https://techsentiments.com/ts-logo.png"],
        datePublished: article.published_at || undefined,
        dateModified: article.published_at || undefined,
        url: canonicalUrl,
        keywords: keywords || undefined,
        articleSection: article.category || undefined,
        author: {
          "@type": "Organization",
          name: "Tech Sentiments",
          url: "https://techsentiments.com",
        },
        publisher: {
          "@type": "Organization",
          name: "Tech Sentiments",
          url: "https://techsentiments.com",
          logo: {
            "@type": "ImageObject",
            url: "https://techsentiments.com/ts-logo.png",
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": canonicalUrl,
        },
      };

      // BreadcrumbList schema: Home → Category → Article
      breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://techsentiments.com",
          },
          ...(article.category
            ? [
                {
                  "@type": "ListItem",
                  position: 2,
                  name: article.category,
                  item: `https://techsentiments.com/?category=${encodeURIComponent(article.category)}`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: article.title,
                  item: canonicalUrl,
                },
              ]
            : [
                {
                  "@type": "ListItem",
                  position: 2,
                  name: article.title,
                  item: canonicalUrl,
                },
              ]),
        ],
      };
    }
  } catch {
    // JSON-LD injection is best-effort; page still renders without it
  }

  return (
    <>
      {newsArticleJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      {children}
    </>
  );
}
