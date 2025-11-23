"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const sentimentColor = (label) => {
    if (label === "positive") return "4px solid #2ecc71"; // green
    if (label === "negative") return "4px solid #e74c3c"; // red
    return "4px solid #f1c40f"; // yellow
  };

  useEffect(() => {
    fetch("http://127.0.0.1:8000/articles")
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json.data)) setData(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: "Arial", padding: "20px" }}>
      <h1>Tech Mood Dashboard</h1>
      <h3>Latest Articles</h3>

      {loading && <p>Loading...</p>}

      {!loading && data.length === 0 && (
        <p>No articles found. Run backend: <b>/run</b></p>
      )}

      <div>
        {data.map((item) => (
          <a
            key={item.id}
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                border: sentimentColor(item.sentiment_label),
                padding: "15px",
                marginBottom: "12px",
                borderRadius: "8px",
                cursor: "pointer",
                background: "white",
                transition: "0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f9f9f9")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "white")
              }
            >
              {/* Thumbnail */}
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt="thumb"
                  style={{
                    width: "140px",
                    height: "90px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    marginBottom: "10px",
                  }}
                />
              )}

              {/* Title clickable */}
              <h2 style={{ color: "#0070f3" }}>{item.title}</h2>

              {/* Real source name clickable */}
              <p>
                <b>Source:</b>{" "}
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#3498db" }}
                >
                  {new URL(item.source_url).hostname.replace("www.", "")}
                </a>
              </p>

              {/* Clean summary (remove embedded HTML!) */}
              <p>{item.summary.replace(/<[^>]+>/g, "")}</p>

              <p>
                <b>Sentiment:</b> {item.sentiment_label} (
                {item.sentiment_score.toFixed(3)})
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
