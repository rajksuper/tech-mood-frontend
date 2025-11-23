"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ArticlePage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/article/${id}`)
      .then((res) => res.json())
      .then((json) => {
        setArticle(json.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!article) return <p>Article not found.</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <a href="/" style={{ display: "block", marginBottom: "20px" }}>
        ← Back
      </a>

      {article.image_url && (
        <img
          src={article.image_url}
          alt="thumbnail"
          style={{
            width: "100%",
            maxHeight: "300px",
            objectFit: "cover",
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        />
      )}

      <h1>{article.title}</h1>
      <p>
        <b>Source:</b> {article.source}
      </p>

      <p style={{ marginTop: "15px" }}>{article.summary}</p>

      <p style={{ marginTop: "20px" }}>
        <b>Sentiment:</b> {article.sentiment_label} (
        {article.sentiment_score.toFixed(3)})
      </p>
    </div>
  );
}
