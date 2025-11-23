"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/articles")
      .then((res) => res.json())
      .then((json) => {
        setData(Array.isArray(json.data) ? json.data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const featuredArticle = data[0];
  const remainingArticles = data.slice(1);

  return (
    <div style={{ fontFamily: "Arial", padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Tech Mood Dashboard</h1>
      <h3 style={{ color: "#666", fontWeight: "normal", marginBottom: "30px" }}>
        Latest 20 Articles - Magazine Style
      </h3>

      {loading && <p>Loading...</p>}

      {/* Featured Article */}
      {featuredArticle && (
        <div
          style={{
            border: `3px solid ${
              featuredArticle.sentiment_label === "positive"
                ? "green"
                : featuredArticle.sentiment_label === "negative"
                ? "red"
                : "#e6b800"
            }`,
            borderRadius: "16px",
            overflow: "hidden",
            background: "white",
            marginBottom: "40px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ display: "flex", gap: "0" }}>
            {featuredArticle.image_url ? (
              <img
                src={featuredArticle.image_url}
                alt="thumbnail"
                style={{
                  width: "50%",
                  height: "400px",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "50%",
                  height: "400px",
                  background:
                    featuredArticle.sentiment_label === "positive"
                      ? "green"
                      : featuredArticle.sentiment_label === "negative"
                      ? "red"
                      : "#e6b800",
                  opacity: 0.2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "96px",
                  fontWeight: "bold",
                }}
              >
                {getSourceName(featuredArticle.source_url)[0].toUpperCase()}
              </div>
            )}

            <div style={{ width: "50%", padding: "32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span
                style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  fontWeight: "600",
                  color: "#999",
                  letterSpacing: "1px",
                  marginBottom: "12px",
                }}
              >
                Featured Article
              </span>
              <a
                href={featuredArticle.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#1a0dab",
                  textDecoration: "none",
                  fontSize: "28px",
                  fontWeight: "700",
                  lineHeight: "1.3",
                  marginBottom: "16px",
                }}
              >
                {featuredArticle.title}
              </a>

              <p style={{ color: "#555", fontSize: "16px", lineHeight: "1.6", marginBottom: "20px" }}>
                {featuredArticle.summary}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <a
                  href={featuredArticle.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#0066cc", textDecoration: "none", fontSize: "14px" }}
                >
                  {getSourceName(featuredArticle.source_url)}
                </a>
                <span
                  style={{
                    background:
                      featuredArticle.sentiment_label === "positive"
                        ? "green"
                        : featuredArticle.sentiment_label === "negative"
                        ? "red"
                        : "#e6b800",
                    color: "white",
                    padding: "6px 16px",
                    borderRadius: "16px",
                    fontWeight: "600",
                    fontSize: "12px",
                    textTransform: "uppercase",
                  }}
                >
                  {featuredArticle.sentiment_label}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remaining Articles Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {remainingArticles.map((item) => {
          const borderColor =
            item.sentiment_label === "positive"
              ? "green"
              : item.sentiment_label === "negative"
              ? "red"
              : "#e6b800";

          return (
            <div
              key={item.id}
              style={{
                border: `2px solid ${borderColor}`,
                borderRadius: "10px",
                overflow: "hidden",
                background: "white",
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt="thumbnail"
                  style={{
                    width: "100%",
                    height: "150px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "150px",
                    background: borderColor,
                    opacity: 0.2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "48px",
                    fontWeight: "bold",
                    color: borderColor,
                  }}
                >
                  {getSourceName(item.source_url)[0].toUpperCase()}
                </div>
              )}

              <div style={{ padding: "12px" }}>
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
                    marginBottom: "8px",
                    lineHeight: "1.3",
                  }}
                >
                  {item.title.length > 80 ? item.title.substring(0, 80) + "..." : item.title}
                </a>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
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
                      padding: "3px 8px",
                      borderRadius: "10px",
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

      <Link
        href="/page/1"
        style={{
          fontSize: "18px",
          display: "block",
          marginTop: "40px",
          textAlign: "center",
          color: "#0066cc",
          textDecoration: "none",
        }}
      >
        More Articles →
      </Link>
    </div>
  );
}