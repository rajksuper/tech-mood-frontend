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
    <div style={{ fontFamily: "Arial", padding: "20px", maxWidth: "1600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Tech Mood Dashboard</h1>
      <h3 style={{ color: "#666", fontWeight: "normal", marginBottom: "30px" }}>
        Latest 20 Articles
      </h3>

      {loading && <p>Loading...</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "24px",
        }}
      >
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
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt="thumbnail"
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "200px",
                    background: borderColor,
                    opacity: 0.2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "64px",
                    fontWeight: "bold",
                    color: borderColor,
                  }}
                >
                  {getSourceName(item.source_url)[0].toUpperCase()}
                </div>
              )}

              <div style={{ padding: "16px" }}>
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#1a0dab",
                    textDecoration: "none",
                    fontSize: "18px",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "12px",
                    lineHeight: "1.4",
                  }}
                >
                  {item.title}
                </a>

                <p
                  style={{
                    margin: "0 0 12px",
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

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#666" }}>
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
                      fontSize: "11px",
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