"use client";
import { useState, useEffect } from "react";

// Clean publisher name
function getSourceName(url) {
  try {
    const host = new URL(url).hostname;
    return host.replace("www.", "").split(".")[0];
  } catch {
    return "Source";
  }
}

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [listArticles, setListArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Fetch categories
    fetch("https://tech-mood-backend-production.up.railway.app/categories")
      .then((res) => res.json())
      .then((json) => setCategories(json.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadArticles();
  }, [selectedCategory]);

  const loadArticles = () => {
    setLoading(true);
    setPage(0);
    const url = selectedCategory
      ? `https://tech-mood-backend-production.up.railway.app/articles?category=${encodeURIComponent(selectedCategory)}`
      : "https://tech-mood-backend-production.up.railway.app/articles";

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        const allArticles = Array.isArray(json.articles) ? json.articles : [];
        
        // Split: 12 with images, 12 without
        const withImages = allArticles.filter(a => a.image_url).slice(0, 12);
        const withoutImages = allArticles.filter(a => !a.image_url).slice(0, 12);
        
        // If not enough without images, fill with remaining
        if (withoutImages.length < 12) {
          const remaining = allArticles.filter(a => a.image_url).slice(12, 24);
          withoutImages.push(...remaining);
        }
        
        setFeaturedArticles(withImages);
        setListArticles(withoutImages);
        setLoading(false);
        setHasMore(allArticles.length >= 24);
      })
      .catch(() => setLoading(false));
  };

  const loadMore = () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const url = selectedCategory
      ? `https://tech-mood-backend-production.up.railway.app/articles/page/${nextPage}?category=${encodeURIComponent(selectedCategory)}`
      : `https://tech-mood-backend-production.up.railway.app/articles/page/${nextPage}`;

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        const allArticles = Array.isArray(json.articles) ? json.articles : [];
        const newWithImages = allArticles.filter(a => a.image_url).slice(0, 12);
        const newWithoutImages = allArticles.filter(a => !a.image_url).slice(0, 12);

        setFeaturedArticles(prev => [...prev, ...newWithImages]);
        setListArticles(prev => [...prev, ...newWithoutImages]);
        setPage(nextPage);
        setLoadingMore(false);
        setHasMore(allArticles.length >= 24);
      })
      .catch(() => setLoadingMore(false));
  };

  const getBorderColor = (sentiment) => {
    if (sentiment === "positive") return "green";
    if (sentiment === "negative") return "red";
    if (sentiment === "mixed") return "#a855f7";
    return "#e6b800";
  };

  return (
    <div
      style={{
        fontFamily: "Courier New, monospace",
        padding: "20px",
        maxWidth: "1600px",
        margin: "0 auto",
      }}
    >
      {/* KEEP YOUR ORIGINAL HEADER */}
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Tech Mood Dashboard</h1>
      <h3 style={{ color: "#666", fontWeight: "normal", marginBottom: "20px" }}>
        Real-time sentiment analysis of technology news
      </h3>

      {/* KEEP YOUR ORIGINAL CATEGORY PILLS */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
          overflowX: "auto",
          whiteSpace: "nowrap",
          paddingBottom: "10px",
        }}
      >
        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontFamily: "Courier New, monospace",
            background: selectedCategory === null ? "#0066cc" : "white",
            color: selectedCategory === null ? "white" : "#333",
            border: "2px solid #0066cc",
            borderRadius: "20px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          All
        </button>
        {categories.filter(cat => cat !== "General Tech").map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontFamily: "Courier New, monospace",
              background: selectedCategory === cat ? "#0066cc" : "white",
              color: selectedCategory === cat ? "white" : "#333",
              border: "2px solid #0066cc",
              borderRadius: "20px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && <p>Loading...</p>}

      {/* FEATURED SECTION - Horizontal Scrollable with Images */}
      {!loading && featuredArticles.length > 0 && (
        <>
          <h2 style={{ fontSize: "24px", marginBottom: "16px", fontWeight: "600" }}>
            Featured Stories
          </h2>
          <div
            style={{
              overflowX: "auto",
              marginBottom: "40px",
              paddingBottom: "10px",
            }}
          >
            <div style={{ display: "flex", gap: "20px", width: "max-content" }}>
              {featuredArticles.map((item) => {
                const borderColor = getBorderColor(item.sentiment_label);

                return (
                  <div
                    key={item.id}
                    style={{
                      width: "320px",
                      flexShrink: 0,
                      border: `2px solid ${borderColor}`,
                      borderRadius: "12px",
                      overflow: "hidden",
                      background: "white",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    <img
                      src={item.image_url}
                      alt="thumbnail"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                      style={{
                        width: "100%",
                        height: "180px",
                        objectFit: "cover",
                      }}
                    />

                    <div style={{ padding: "16px" }}>
                      {item.category && (
                        <span
                          style={{
                            fontSize: "10px",
                            background: "#e3f2fd",
                            color: "#1976d2",
                            padding: "4px 8px",
                            borderRadius: "8px",
                            marginBottom: "8px",
                            display: "inline-block",
                            fontWeight: "600",
                          }}
                        >
                          {item.category}
                        </span>
                      )}

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#1a0dab",
                          textDecoration: "none",
                          fontSize: "15px",
                          fontWeight: "600",
                          display: "block",
                          marginBottom: "10px",
                          lineHeight: "1.3",
                          fontFamily: "Courier New, monospace",
                        }}
                      >
                        {item.title.length > 70 ? item.title.substring(0, 70) + "..." : item.title}
                      </a>

                      <p
                        style={{
                          margin: "0 0 10px",
                          color: "#555",
                          fontSize: "14px",
                          lineHeight: "1.5",
                          fontFamily: "Courier New, monospace",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.summary}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "11px",
                        }}
                      >
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#0066cc", textDecoration: "none" }}
                        >
                          {getSourceName(item.url)}
                        </a>
                        <span
                          style={{
                            background: borderColor,
                            color: "white",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                          }}
                        >
                          {item.sentiment_label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* LIST SECTION - Compact Articles without Images */}
      {!loading && listArticles.length > 0 && (
        <>
          <h2 style={{ fontSize: "24px", marginBottom: "16px", fontWeight: "600" }}>
            More Articles
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {listArticles.map((item) => {
              const borderColor = getBorderColor(item.sentiment_label);

              return (
                <div
                  key={item.id}
                  style={{
                    borderLeft: `6px solid ${borderColor}`,
                    borderRadius: "8px",
                    padding: "16px 20px",
                    background: "white",
                    display: "flex",
                    gap: "20px",
                    alignItems: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(8px)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
                    e.currentTarget.style.background = "#fafafa";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
                    e.currentTarget.style.background = "white";
                  }}
                >
                  {/* Colored Initial */}
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "6px",
                      background: `linear-gradient(135deg, ${borderColor}20, ${borderColor}40)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: borderColor,
                      flexShrink: 0,
                    }}
                  >
                    {item.category ? item.category[0].toUpperCase() : "T"}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#1a0dab",
                        textDecoration: "none",
                        fontSize: "18px",
                        fontWeight: "600",
                        display: "block",
                        marginBottom: "8px",
                        lineHeight: "1.4",
                        fontFamily: "Courier New, monospace",
                      }}
                    >
                      {item.title}
                    </a>

                    <p
                      style={{
                        margin: "0 0 10px",
                        color: "#555",
                        fontSize: "14px",
                        lineHeight: "1.5",
                        fontFamily: "Courier New, monospace",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.summary}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "#666" }}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#0066cc",
                          textDecoration: "none",
                          fontWeight: "500",
                        }}
                      >
                        {getSourceName(item.url)}
                      </a>
                      <span style={{ color: "#ccc" }}>•</span>
                      <span>
                        {item.published_at
                          ? new Date(item.published_at).toLocaleTimeString()
                          : ""}
                      </span>
                    </div>
                  </div>

                  {/* Sentiment Badge */}
                  <div
                    style={{
                      background: borderColor,
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontWeight: "600",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    {item.sentiment_label}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* KEEP YOUR ORIGINAL LOAD MORE BUTTON */}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          style={{
            display: "block",
            margin: "40px auto",
            padding: "16px 40px",
            fontSize: "16px",
            fontWeight: "600",
            fontFamily: "Courier New, monospace",
            background: loadingMore ? "#ccc" : "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: loadingMore ? "not-allowed" : "pointer",
          }}
        >
          {loadingMore ? "Loading..." : "Load More Articles"}
        </button>
      )}
    </div>
  );
}