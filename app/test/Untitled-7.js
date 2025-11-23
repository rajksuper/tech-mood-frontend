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

  return (
    <div style={{ fontFamily: "Arial", padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Tech Mood Dashboard</h1>
      <h3 style={{ color: "#666", fontWeight: "normal", marginBottom: "30px" }}>
        Latest 20 Articles - Compact List
      </h3>

      {loading && <p>Loading...</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {data.map((item) => {
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
              {/* Image or Placeholder */}
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt="thumbnail"
                  style={{
                    width: "140px",
                    height: "90px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "140px",
                    height: "90px",
                    borderRadius: "6px",
                    background: `linear-gradient(135deg, ${borderColor}20, ${borderColor}40)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "40px",
                    fontWeight: "bold",
                    color: borderColor,
                    flexShrink: 0,
                  }}
                >
                  {getSourceName(item.source_url)[0].toUpperCase()}
                </div>
              )}

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#1a0dab",
                    textDecoration: "none",
                    fontSize: "18px",
                    fontFamily: "Courier New, monospace",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "8px",
                    lineHeight: "1.4",
                  }}
                >
                  {item.title}
                </a>

                <p
                  style={{
                    margin: "0 0 10px",
                    color: "#555",
                    fontSize: "14px",
                    fontFamily: "Courier New, monospace",
                     fontWeight: "400",
                    lineHeight: "1.5",
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
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#0066cc",
                      textDecoration: "none",
                      fontWeight: "500",
                    }}
                  >
                    {getSourceName(item.source_url)}
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

      <Link
        href="/page/1"
        style={{
          fontSize: "18px",
          display: "block",
          marginTop: "40px",
          textAlign: "center",
          color: "#0066cc",
          textDecoration: "none",
          fontWeight: "500",
        }}
      >
        More Articles →
      </Link>
    </div>
  );
}