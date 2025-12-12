// app/layout.jsx
export const metadata = {
  title: "Tech Sentiments - AI-Powered Tech News Sentiment Analysis",
  description: "Real-time tech news with AI sentiment analysis. Track Bitcoin, Tesla, Nvidia, OpenAI and more. See if news is positive, negative, or neutral instantly.",
  keywords: "tech news, sentiment analysis, AI news, bitcoin news, tesla news, nvidia news, stock sentiment, crypto sentiment, tech sentiment analysis, market sentiment",
  authors: [{ name: "Tech Sentiments" }],
  creator: "Tech Sentiments",
  publisher: "Tech Sentiments",
  robots: "index, follow",
  icons: {
    icon: "/favicon-32x32.png",
    shortcut: "/favicon-32x32.png",
    apple: "/favicon-32x32.png",
  },
  openGraph: {
    title: "Tech Sentiments - AI-Powered Tech News Sentiment Analysis",
    description: "Real-time tech news with AI sentiment analysis. Track Bitcoin, Tesla, Nvidia, OpenAI and more.",
    url: "https://techsentiments.com",
    siteName: "Tech Sentiments",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://techsentiments.com/ts-logo.png",
        width: 512,
        height: 512,
        alt: "Tech Sentiments Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tech Sentiments - AI-Powered Tech News",
    description: "Real-time tech news with AI sentiment analysis. Track Bitcoin, Tesla, Nvidia, OpenAI and more.",
    images: ["https://techsentiments.com/ts-logo.png"],
  },
  alternates: {
    canonical: "https://techsentiments.com",
  },
};

export default function RootLayout({ children }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Tech Sentiments",
    "url": "https://techsentiments.com",
    "description": "AI-powered tech news sentiment analysis platform",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://techsentiments.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Tech Sentiments",
    "url": "https://techsentiments.com",
    "logo": "https://techsentiments.com/ts-logo.png",
    "description": "AI-powered tech news sentiment analysis"
  };

  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0d0d0d" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
      </head>
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}