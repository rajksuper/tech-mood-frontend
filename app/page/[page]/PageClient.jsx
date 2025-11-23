"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PageClient({ pageNum }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/articles/page/${pageNum}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pageNum]);

  return (
    <div style={{ fontFamily: "Arial", padding: "20px" }}>
      <h1>Page {pageNum}</h1>

      {loading && <p>Loading...</p>}

      {data.map((item) => (
        <div
          key={item.id}
          style={{
            border: "2px solid #ccc",
            padding: "15px",
            marginBottom: "20px",
            borderRadius: "10px",
          }}
        >
          <a href={item.source_url} target="_blank">
            <h2>{item.title}</h2>
          </a>

          <p>{item.summary}</p>
        </div>
      ))}

      <div style={{ marginTop: "20px" }}>
        {pageNum > 1 && <Link href={`/page/${pageNum - 1}`}>← Previous</Link>}
        {data.length > 0 && (
          <Link href={`/page/${pageNum + 1}`} style={{ marginLeft: "20px" }}>
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
