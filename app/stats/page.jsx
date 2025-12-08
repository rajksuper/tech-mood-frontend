"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function StatsPage() {
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCount = () => {
    setLoading(true);
    fetch("https://tech-mood-backend-production.up.railway.app/articles/count")
      .then((res) => res.json())
      .then((json) => {
        setTotal(json.count || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCount();
  }, []);

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: "100vh",
        background: "#0d0d0d",
        color: "#e0e0e0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Link
        href="/"
        style={{
          color: "#4da3ff",
          textDecoration: "none",
          position: "absolute",
          top: "20px",
          left: "20px",
        }}
      >
        ← Home
      </Link>

      <h1 style={{ fontSize: "24px", marginBottom: "30px", color: "#888" }}>
        Total Articles
      </h1>

      <div
        style={{
          fontSize: "120px",
          fontWeight: "700",
          color: "#4ade80",
          lineHeight: "1",
        }}
      >
        {loading ? "..." : total?.toLocaleString()}
      </div>

      <button
        onClick={fetchCount}
        style={{
          marginTop: "40px",
          padding: "12px 24px",
          fontSize: "16px",
          background: "#333",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        🔄 Refresh
      </button>

      <p style={{ marginTop: "20px", color: "#666", fontSize: "14px" }}>
        Last checked: {new Date().toLocaleTimeString()}
      </p>
    </div>
  );
}