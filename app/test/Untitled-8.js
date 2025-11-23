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

  // Separate articles with and without images
  const articlesWithImages = data.filter(item => item.image_url);
  const articlesWithoutImages = data.filter(item => !item.image_url);

  return (
    <div style={{ fontFamily: "Arial", padding: "20px", maxWidth: "1800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Tech Mood Dashboard</h1>
      <h3 style={{ color: "#666", fontWeight: "normal", marginBottom: "30px" }}>
        Latest Articles
      </h3>

      {loading && <p>Loading...</p>}

      {/* Two Column Layout: 80% left, 20% right */}
      <div style={{ display: "flex", gap: "30px" }}>
        
        {/* LEFT COLUMN - 80% - 4 cards per row with images */}
        <div style={{ flex: "0 0 80%", display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Group into rows of 4 */}
          {Array.from({ length: Math.ceil(articlesWithImages.length / 4) }).map((_, rowIndex) => {
            const rowArticles = articlesWithImages.slice(rowIndex * 4, (rowIndex + 1) * 4);
            
            return (
              <div
                key={rowIndex}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "20px",
                }}
              >
                {rowArticles.map((item) => {
                  const borderColor =
                    item.sentiment_label === "positive"
                      ? "green"
                      : item.sentiment_label === "negative"
                      ? "red"
                      : item.sentiment_label === "mixed"
                      ? "#a855f7"
                      : "#e6b800";

                  return (
                    <div
                      key={item.id}
                      style={{
                        border: `2px solid ${borderColor}`,
                        borderRadius: "12px",
                        overflow: "hidden",
                        background: "white",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                      }}
                    >
                      {/* Image */}
                      <img
                        src={item.image_url}
                        alt="thumbnail"
                        style={{
                          width: "100%",
                          height: "180px",
                          objectFit: "cover",
                        }}
                      />

                      {/* Content */}
                      <div style={{ padding: "16px" }}>
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
                            fontSize: "13px",
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
                })}
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN - 20% - Text only articles, one per row */}
        <div style={{ flex: "0 0 20%", display: "flex", flexDirection: "column", gap: "20px" }}>
          {articlesWithoutImages.map((item) => {
            const borderColor =
              item.sentiment_label === "positive"
                ? "green"
                : item.sentiment_label === "negative"
                ? "red"
                : item.sentiment_label === "mixed"
                ? "#a855f7"
                : "#e6b800";

            return (
              <div
                key={item.id}
                style={{
                  border: `2px solid ${borderColor}`,
                  borderRadius: "10px",
                  padding: "16px",
                  background: "white",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateX(-4px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
                }}
              >
                {/* Sentiment Badge */}
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

                {/* Title */}
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#1a0dab",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "8px",
                    lineHeight: "1.3",
                    fontFamily: "Courier New, monospace",
                  }}
                >
                  {item.title}
                </a>

                <p
                  style={{
                    margin: "0 0 8px",
                    color: "#555",
                    fontSize: "12px",
                    lineHeight: "1.4",
                    fontFamily: "Courier New, monospace",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {item.summary}
                </p>

                {/* Source */}
                <div style={{ fontSize: "11px", color: "#666" }}>
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0066cc", textDecoration: "none" }}
                  >
                    {getSourceName(item.source_url)}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
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