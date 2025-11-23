"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

function getSourceName(url) {
  try {
    const host = new URL(url).hostname;
    return host.replace("www.", "").split(".")[0];
  } catch {
    return "Source";
  }
}

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const pageNum = parseInt(params.page, 10);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/articles/page/${pageNum}`)
      .then((res) => res.json())
      .then((json) => {
        setData(Array.isArray(json.data) ? json.data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pageNum]);

  return (
    <div style={{ fontFamily: "Arial", padding: "20px" }}>
      <h1>More Articles — Page {pageNum}</h1>

      {loading && <p>Loading...</p>}

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
              padding: "16px",
              marginBottom: "18px",
              background: "white",
              display: "flex",
              gap: "16px",
              alignItems: "flex-start",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              transition: "0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(0,0,0,0.15)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 1px 3px rgba(0,0,0,0.08)")
            }
          >
            {item.image_url ? (
  <img
    src={item.image_url}
    alt="thumbnail"
    style={{
      width: "120px",
      height: "80px",
      objectFit: "cover",
      borderRadius: "8px",
    }}
  />
) : (
  <div
    style={{
      width: "120px",
      height: "80px",
      borderRadius: "8px",
      background: borderColor,
      opacity: 0.15,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "32px",
      fontWeight: "bold",
      color: borderColor,
    }}
  >
    {getSourceName(item.source_url)[0].toUpperCase()}
  </div>
)}
            <div style={{ flex: 1 }}>
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#1a0dab", textDecoration: "none" }}
              >
                <h2 style={{ margin: "0 0 8px" }}>{item.title}</h2>
              </a>

              <p style={{ margin: "0 0 8px", color: "#444" }}>
                {item.summary}
              </p>

              <p style={{ margin: 0, color: "#555" }}>
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#0066cc", textDecoration: "none" }}
                >
                  {getSourceName(item.source_url)}
                </a>
                {" • "}
                {item.published_at
                  ? new Date(item.published_at).toLocaleTimeString()
                  : ""}
                {" • "}
                <span style={{ color: borderColor, fontWeight: "bold" }}>
                  {item.sentiment_label} ({item.sentiment_score.toFixed(3)})
                </span>
              </p>
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: "30px", display: "flex", gap: "20px" }}>
        {pageNum > 1 && (
          <button
            onClick={() => router.push(`/page/${pageNum - 1}`)}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              cursor: "pointer",
              background: "white",
            }}
          >
            ← Previous
          </button>
        )}

        <button
          onClick={() => router.push(`/page/${pageNum + 1}`)}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            cursor: "pointer",
            background: "white",
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
