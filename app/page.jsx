"use client";

import { useEffect, useState } from "react";

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
  const [data, setData] = useState({ withImages: [], withoutImages: [] });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Fetch categories
    fetch("http://127.0.0.1:8000/categories")
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
      ? `http://127.0.0.1:8000/articles?category=${encodeURIComponent(selectedCategory)}`
      : "http://127.0.0.1:8000/articles";

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        setData({
          withImages: Array.isArray(json.with_images) ? json.with_images : [],
          withoutImages: Array.isArray(json.without_images) ? json.without_images : [],
        });
        setLoading(false);
        if (json.with_images?.length < 12 && json.without_images?.length < 12) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      })
      .catch(() => setLoading(false));
  };

  const loadMore = () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const url = selectedCategory
      ? `http://127.0.0.1:8000/articles/page/${nextPage}?category=${encodeURIComponent(selectedCategory)}`
      : `http://127.0.0.1:8000/articles/page/${nextPage}`;

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        const newWithImages = Array.isArray(json.with_images) ? json.with_images : [];
        const newWithoutImages = Array.isArray(json.without_images) ? json.without_images : [];

        setData((prev) => ({
          withImages: [...prev.withImages, ...newWithImages],
          withoutImages: [...prev.withoutImages, ...newWithoutImages],
        }));
        setPage(nextPage);
        setLoadingMore(false);
        if (newWithImages.length < 12 && newWithoutImages.length < 12) {
          setHasMore(false);
        }
      })
      .catch(() => setLoadingMore(false));
  };

  // Create alternating rows: 4 with images, then 4 without images
  const createRows = () => {
    const rows = [];
    const maxImageRows = Math.ceil(data.withImages.length / 4);
    const maxTextRows = Math.ceil(data.withoutImages.length / 4);
    const maxRows = Math.max(maxImageRows, maxTextRows);

    for (let i = 0; i < maxRows; i++) {
      const imageStart = i * 4;
      const imageArticles = data.withImages.slice(imageStart, imageStart + 4);
      if (imageArticles.length > 0) {
        rows.push({ type: "image", articles: imageArticles });
      }

      const textStart = i * 4;
      const textArticles = data.withoutImages.slice(textStart, textStart + 4);
      if (textArticles.length > 0) {
        rows.push({ type: "text", articles: textArticles });
      }
    }

    return rows;
  };

  const rows = createRows();

  return (
    <div
      style={{
        fontFamily: "Courier New, monospace",
        padding: "20px",
        maxWidth: "1600px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Tech Mood Dashboard</h1>
      <h3 style={{ color: "#666", fontWeight: "normal", marginBottom: "20px" }}>
        Real-time sentiment analysis of technology news
      </h3>

      {/* Category Filter Pills */}
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

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {row.articles.map((item) => {
              const borderColor =
                item.sentiment_label === "positive"
                  ? "green"
                  : item.sentiment_label === "negative"
                  ? "red"
                  : item.sentiment_label === "mixed"
                  ? "#a855f7"
                  : "#e6b800";

              if (row.type === "image") {
                return (
                  <div
                    key={item.id}
                    style={{
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
                        href={item.source_url}
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
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#0066cc", textDecoration: "none" }}
                        >
                          {getSourceName(item.source_url)}
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
              }

              return (
                <div
                  key={item.id}
                  style={{
                    border: `2px solid ${borderColor}`,
                    borderRadius: "12px",
                    background: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    padding: "16px",
                  }}
                >
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
                        marginRight: "8px",
                      }}
                    >
                      {item.category}
                    </span>
                  )}

                  <div
                    style={{
                      background: borderColor,
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: "10px",
                      fontSize: "10px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      display: "inline-block",
                      marginBottom: "10px",
                    }}
                  >
                    {item.sentiment_label}
                  </div>

                  <a
                    href={item.source_url}
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
                    {item.title}
                  </a>

                  {item.summary && (
                    <p
                      style={{
                        margin: "0 0 10px",
                        color: "#555",
                        fontSize: "14px",
                        lineHeight: "1.5",
                        fontFamily: "Courier New, monospace",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.summary}
                    </p>
                  )}

                  <div style={{ fontSize: "11px", color: "#666" }}>
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0066cc", textDecoration: "none" }}
                    >
                      {getSourceName(item.source_url)}
                    </a>
                    <span style={{ color: "#ccc", margin: "0 8px" }}>•</span>
                    <span>
                      {item.published_at ? new Date(item.published_at).toLocaleTimeString() : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

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