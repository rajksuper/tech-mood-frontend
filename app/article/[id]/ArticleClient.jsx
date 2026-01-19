"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Helper: Get source name from URL
function getSourceName(url) {
  try {
    const host = new URL(url).hostname;
    return host.replace("www.", "").split(".")[0];
  } catch {
    return "Source";
  }
}

// Helper: Get relative time
function getTimeAgo(publishedAt) {
  if (!publishedAt) return "";
  
  const now = new Date();
  const published = new Date(publishedAt);
  const diffMs = now - published;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
  return "";
}

// Get category hashtag
function getCategoryHashtag(category) {
  const hashtags = {
    "AI & ML": "#AI #MachineLearning #Tech",
    "Big Tech": "#BigTech #Tech #Technology",
    "Cybersecurity": "#Cybersecurity #Security #Tech",
    "General Tech": "#Tech #Technology #TechNews",
    "Markets & Finance": "#Finance #Markets #Tech",
    "Startups & VC": "#Startups #VentureCapital #Tech"
  };
  return hashtags[category] || "#Tech #TechNews";
}

// Share functions with hashtags
function shareOnTwitter(article) {
  const url = `https://techsentiments.com/article/${article.id}`;
  const hashtags = getCategoryHashtag(article.category);
  const text = encodeURIComponent(`${article.title}\n\n${hashtags}\n\n${url}`);
  window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
}

function shareOnLinkedIn(article) {
  const url = encodeURIComponent(`https://techsentiments.com/article/${article.id}`);
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
}

function copyLink(article, setCopiedId) {
  const hashtags = getCategoryHashtag(article.category);
  const text = `${article.title}\n\n${hashtags}\n\nhttps://techsentiments.com/article/${article.id}`;
  navigator.clipboard.writeText(text);
  setCopiedId(article.id);
  setTimeout(() => setCopiedId(null), 2000);
}

export default function ArticleClient({ id }) {
  const router = useRouter();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Save functionality
  const [savedArticles, setSavedArticles] = useState([]);
  const [showSavedDropdown, setShowSavedDropdown] = useState(false);

  // Mark component as mounted and inject mobile styles
  useEffect(() => {
    setHasMounted(true);

    const style = document.createElement('style');
    style.id = 'article-mobile-dark-bg';
    style.textContent = `
      @media (max-width: 768px) {
        html, body, #__next {
          background: #0d0d0d !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow-x: hidden !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('article-mobile-dark-bg');
      if (existingStyle) existingStyle.remove();
    };
  }, []);

  // Load saved articles on mount
  useEffect(() => {
    const storedSaved = localStorage.getItem('savedArticles');
    if (storedSaved) setSavedArticles(JSON.parse(storedSaved));
  }, []);

  // Save functions
  const isArticleSaved = (articleId) => savedArticles.some(a => a.id === articleId);
  
  const toggleSave = (articleToSave) => {
    let newSaved;
    if (isArticleSaved(articleToSave.id)) {
      newSaved = savedArticles.filter(a => a.id !== articleToSave.id);
    } else {
      newSaved = [...savedArticles, articleToSave];
    }
    setSavedArticles(newSaved);
    localStorage.setItem('savedArticles', JSON.stringify(newSaved));
  };

  const removeFromSaved = (articleId) => {
    const newSaved = savedArticles.filter(a => a.id !== articleId);
    setSavedArticles(newSaved);
    localStorage.setItem('savedArticles', JSON.stringify(newSaved));
  };

  // Detect mobile
  useEffect(() => {
    if (!hasMounted) return;
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [hasMounted]);

  // Fetch main article
  useEffect(() => {
    setLoading(true);
    fetch(`https://api.techsentiments.com/article/${id}`)
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

  // Fetch related articles when article loads
  useEffect(() => {
    if (!article) return;
    fetchRelatedArticles(1);
  }, [article]);

  // Fetch related articles with pagination
  const fetchRelatedArticles = (page) => {
    if (!article?.category) return;
    
    setRelatedLoading(true);
    const pageNum = page - 1;
    const limit = 12;

    Promise.all([
      fetch(`https://api.techsentiments.com/articles/images?page=${pageNum}&limit=${limit}&category=${encodeURIComponent(article.category)}`),
      fetch(`https://api.techsentiments.com/articles/text?page=${pageNum}&limit=${limit}&category=${encodeURIComponent(article.category)}`)
    ])
      .then(([imgRes, txtRes]) => Promise.all([imgRes.json(), txtRes.json()]))
      .then(([imgJson, txtJson]) => {
        const imageArticles = imgJson.articles || [];
        const textArticles = txtJson.articles || [];
        
        const combined = [];
        const maxLen = Math.max(imageArticles.length, textArticles.length);
        for (let i = 0; i < maxLen; i++) {
          if (imageArticles[i]) combined.push(imageArticles[i]);
          if (textArticles[i]) combined.push(textArticles[i]);
        }
        
        const filtered = combined.filter(a => a.id !== article.id);
        
        setRelatedArticles(filtered);
        
        const totalCount = Math.max(imgJson.count || 0, txtJson.count || 0);
        setTotalPages(Math.max(1, Math.ceil(totalCount / 12)));
        setRelatedLoading(false);
      })
      .catch(() => {
        setRelatedLoading(false);
      });
  };

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
    fetchRelatedArticles(page);
    window.scrollTo({ top: 800, behavior: 'smooth' });
  };

  const nextPage = () => {
    if (currentPage < totalPages) goToPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  // Sentiment colors
  const getBorderColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case "positive": return "#22c55e";
      case "negative": return "#ef4444";
      case "neutral": return "#eab308";
      case "mixed": return "#a855f7";
      default: return "#666";
    }
  };

  if (!hasMounted) return null;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: isMobile ? '#0d0d0d' : '#f8f9fa',
        color: isMobile ? '#ffffff' : '#1a1a1a'
      }}>
        <p>Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: isMobile ? '#0d0d0d' : '#f8f9fa',
        color: isMobile ? '#ffffff' : '#1a1a1a',
        padding: '20px'
      }}>
        <p style={{ fontSize: '18px', marginBottom: '20px' }}>Article not found</p>
        <Link
          href="/"
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          Go to Home
        </Link>
      </div>
    );
  }

  const borderColor = getBorderColor(article.sentiment_label);

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        minHeight: "100vh",
        background: isMobile ? "#0d0d0d" : "#f8f9fa",
        color: isMobile ? "#e0e0e0" : "#333",
        overflowX: "hidden",
      }}
    >
      {/* HEADER - Exact match to search page */}
      <header
        style={{
          padding: isMobile ? "12px 15px" : "12px 20px",
          background: isMobile ? "#0d0d0d" : "white",
          borderBottom: isMobile ? "1px solid #222" : "1px solid #e0e0e0",
          position: "sticky",
          top: 0,
          zIndex: 100,
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            justifyContent: "space-between",
            gap: isMobile ? "10px" : "15px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Row 1 on Mobile: Logo + Saved */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: isMobile ? "100%" : "auto",
            }}
          >
            {/* Logo + Name - Click to go home */}
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
              }}
            >
              <img
                src="/ts-logo.png"
                alt="Logo"
                style={{
                  width: isMobile ? "28px" : "32px",
                  height: isMobile ? "28px" : "32px",
                }}
              />
              <span
                style={{
                  fontSize: isMobile ? "18px" : "20px",
                  fontWeight: "700",
                  color: isMobile ? "#ffffff" : "#1a1a1a",
                  whiteSpace: "nowrap",
                }}
              >
                {isMobile ? "TS" : "Tech Sentiments"}
              </span>
            </Link>

            {/* Saved - Mobile */}
            {isMobile && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowSavedDropdown(!showSavedDropdown)}
                  style={{
                    padding: "6px 10px",
                    fontSize: "12px",
                    background: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "6px",
                    cursor: "pointer",
                    color: "#e0e0e0",
                  }}
                >
                  🔖 {savedArticles.length}
                </button>

                {showSavedDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: "4px",
                      background: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      zIndex: 1000,
                      width: "280px",
                      maxHeight: "400px",
                      overflow: "auto",
                    }}
                  >
                    {savedArticles.length === 0 ? (
                      <div style={{ padding: "20px", textAlign: "center", color: "#888" }}>
                        No saved articles
                      </div>
                    ) : (
                      savedArticles.map((saved) => (
                        <div
                          key={saved.id}
                          style={{
                            padding: "12px",
                            borderBottom: "1px solid #333",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "10px",
                          }}
                        >
                          <a
                            href={saved.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#4da3ff",
                              textDecoration: "none",
                              fontSize: "13px",
                              lineHeight: "1.3",
                              flex: 1,
                            }}
                          >
                            {saved.title}
                          </a>
                          <button
                            onClick={() => removeFromSaved(saved.id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "14px",
                              color: "#888",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search Bar - Row 2 on Mobile, inline on Desktop */}
          <form
            onSubmit={handleSearch}
            style={{
              flex: 1,
              maxWidth: isMobile ? "100%" : "550px",
              minWidth: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative", width: "100%", minWidth: 0 }}>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={isMobile 
                  ? "Smart search: 'what's up with OpenAI'" 
                  : "Smart search: Understands typos & natural language: 'what's up with OpenAI'"
                }
                style={{
                  width: "100%",
                  padding: isMobile ? "10px 40px 10px 14px" : "11px 45px 11px 16px",
                  fontSize: isMobile ? "16px" : "13px",
                  border: isMobile ? "1px solid #333" : "1px solid #ddd",
                  borderRadius: "25px",
                  background: isMobile ? "#1a1a1a" : "#fff",
                  color: isMobile ? "#e0e0e0" : "#333",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="submit"
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: isMobile ? "16px" : "18px",
                  padding: "4px",
                }}
              >
                🔍
              </button>
            </div>
          </form>

          {/* Saved - Desktop only */}
          {!isMobile && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowSavedDropdown(!showSavedDropdown)}
                style={{
                  padding: "8px 12px",
                  fontSize: "14px",
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: "#333",
                }}
              >
                🔖 {savedArticles.length}
              </button>

              {showSavedDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "4px",
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 1000,
                    width: "300px",
                    maxHeight: "400px",
                    overflow: "auto",
                  }}
                >
                  {savedArticles.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#888" }}>
                      No saved articles
                    </div>
                  ) : (
                    savedArticles.map((saved) => (
                      <div
                        key={saved.id}
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #eee",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "10px",
                        }}
                      >
                        <a
                          href={saved.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#1a0dab",
                            textDecoration: "none",
                            fontSize: "13px",
                            lineHeight: "1.3",
                            flex: 1,
                          }}
                        >
                          {saved.title}
                        </a>
                        <button
                          onClick={() => removeFromSaved(saved.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "14px",
                            color: "#888",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Click outside to close dropdown */}
      {showSavedDropdown && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99,
          }}
          onClick={() => setShowSavedDropdown(false)}
        />
      )}

      {/* Main Article */}
      <main style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: isMobile ? '20px 15px' : '40px 20px'
      }}>
        {/* Article Card */}
        <div style={{
          background: isMobile ? '#1a1a1a' : 'white',
          borderRadius: '12px',
          padding: isMobile ? '20px' : '30px',
          marginBottom: '40px',
          borderLeft: `6px solid ${borderColor}`,
          boxShadow: isMobile ? 'none' : '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          {/* Category badge */}
          <div style={{ marginBottom: '15px' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              background: isMobile ? '#2a2a2a' : '#f0f0f0',
              color: isMobile ? '#4da3ff' : '#3b82f6',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              {article.category}
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: isMobile ? '22px' : '28px',
            fontWeight: '700',
            lineHeight: '1.3',
            marginBottom: '15px',
            color: isMobile ? '#ffffff' : '#1a1a1a'
          }}>
            {article.title}
          </h1>

          {/* Meta info */}
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            marginBottom: '20px',
            fontSize: '13px',
            color: isMobile ? '#888' : '#666',
            flexWrap: 'wrap'
          }}>
            <span style={{ color: isMobile ? '#4da3ff' : '#0066cc' }}>
              {getSourceName(article.source_url)}
            </span>
            {article.published_at && (
              <>
                <span>•</span>
                <span>{getTimeAgo(article.published_at)}</span>
              </>
            )}
            <span>•</span>
            <span style={{
              background: borderColor,
              color: 'white',
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
            }}>
              {article.sentiment_label}
            </span>
          </div>

          {/* Image */}
          {article.image_url && (
            <img
              src={article.image_url}
              alt={article.title}
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'cover',
                borderRadius: '8px',
                marginBottom: '20px'
              }}
            />
          )}

          {/* Full Summary */}
          {article.summary && (
            <div style={{
              fontSize: '15px',
              lineHeight: '1.7',
              marginBottom: '20px',
              color: isMobile ? '#ccc' : '#444',
              padding: '15px',
              background: isMobile ? '#0d0d0d' : '#f8f9fa',
              borderRadius: '8px',
              borderLeft: '4px solid #3b82f6'
            }}>
              <p style={{ margin: 0 }}>{article.summary}</p>
            </div>
          )}

          {/* Sentiment Analysis Box */}
          <div style={{
            background: isMobile ? '#0d0d0d' : '#f8f9fa',
            border: `2px solid ${borderColor}`,
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '28px' }}>
              {article.sentiment_label === 'positive' ? '📈' : article.sentiment_label === 'negative' ? '📉' : '➡️'}
            </span>
            <div>
              <div style={{ fontSize: '12px', color: isMobile ? '#888' : '#666', marginBottom: '2px' }}>
                AI Sentiment Analysis
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: borderColor,
                textTransform: 'capitalize'
              }}>
                {article.sentiment_label}
              </div>
              {article.sentiment_score && (
                <div style={{ fontSize: '12px', color: isMobile ? '#666' : '#888' }}>
                  Confidence: {(article.sentiment_score * 100).toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          {/* Read Full Article Button */}
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#3b82f6',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '15px',
            }}
          >
            Read Full Article on {getSourceName(article.source_url)} →
          </a>
        </div>

        {/* Related Articles Section */}
        <div>
          <h2 style={{
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: '600',
            marginBottom: '20px',
            color: isMobile ? '#888' : '#666'
          }}>
            More from {article.category}
          </h2>

          {relatedLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: isMobile ? '#888' : '#666' }}>
              Loading related articles...
            </div>
          ) : relatedArticles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: isMobile ? '#888' : '#666' }}>
              No related articles found
            </div>
          ) : (
            <>
              {/* Related Articles - Search Results Style */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                marginBottom: '40px'
              }}>
                {relatedArticles.map((item) => {
                  const itemBorderColor = getBorderColor(item.sentiment_label);
                  const isSaved = isArticleSaved(item.id);

                  return (
                    <div
                      key={item.id}
                      style={{
                        borderLeft: `6px solid ${itemBorderColor}`,
                        borderRadius: "8px",
                        padding: isMobile ? "12px" : "16px 20px",
                        background: isMobile ? "#1a1a1a" : "white",
                        display: "flex",
                        gap: isMobile ? "12px" : "20px",
                        alignItems: "flex-start",
                        boxShadow: isMobile ? "none" : "0 2px 6px rgba(0,0,0,0.08)",
                      }}
                    >
                      {/* Image or Placeholder */}
                      {item.image_url ? (
                        <Link href={`/article/${item.id}`} style={{ flexShrink: 0 }}>
                          <img
                            src={item.image_url}
                            alt="thumbnail"
                            style={{
                              width: isMobile ? "80px" : "140px",
                              height: isMobile ? "60px" : "90px",
                              objectFit: "cover",
                              borderRadius: "6px",
                            }}
                          />
                        </Link>
                      ) : (
                        <Link
                          href={`/article/${item.id}`}
                          style={{
                            width: isMobile ? "80px" : "140px",
                            height: isMobile ? "60px" : "90px",
                            borderRadius: "6px",
                            background: `linear-gradient(135deg, ${itemBorderColor}20, ${itemBorderColor}40)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: isMobile ? "24px" : "40px",
                            fontWeight: "bold",
                            color: itemBorderColor,
                            flexShrink: 0,
                            textDecoration: "none",
                          }}
                        >
                          {getSourceName(item.source_url)[0].toUpperCase()}
                        </Link>
                      )}

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link
                          href={`/article/${item.id}`}
                          style={{
                            color: isMobile ? "#4da3ff" : "#1a0dab",
                            textDecoration: "none",
                            fontSize: isMobile ? "15px" : "18px",
                            fontWeight: "600",
                            display: "block",
                            marginBottom: "8px",
                            lineHeight: "1.4",
                          }}
                        >
                          {item.title}
                        </Link>

                        {item.summary && (
                          <p
                            style={{
                              color: isMobile ? "#aaa" : "#555",
                              fontSize: isMobile ? "13px" : "14px",
                              marginBottom: "10px",
                              lineHeight: "1.5",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              margin: "0 0 10px 0",
                            }}
                          >
                            {item.summary}
                          </p>
                        )}

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: isMobile ? "11px" : "13px",
                            color: isMobile ? "#888" : "#888",
                            flexWrap: "wrap",
                          }}
                        >
                          <span style={{ color: isMobile ? "#4da3ff" : "#0066cc" }}>
                            {getSourceName(item.source_url)}{getTimeAgo(item.published_at) && ` • ${getTimeAgo(item.published_at)}`}
                          </span>
                          <span>•</span>
                          <span
                            style={{
                              background: itemBorderColor,
                              color: "white",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "10px",
                              fontWeight: "600",
                              textTransform: "uppercase",
                            }}
                          >
                            {item.sentiment_label}
                          </span>
                          {item.category && (
                            <>
                              <span>•</span>
                              <span
                                style={{
                                  background: isMobile ? "#2a2a2a" : "#f0f0f0",
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  fontSize: "10px",
                                  color: isMobile ? "#aaa" : "#666",
                                }}
                              >
                                {item.category}
                              </span>
                            </>
                          )}
                          
                          {/* Share & Save Icons */}
                          <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
                            <button
                              onClick={() => shareOnTwitter(item)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "14px",
                                color: isMobile ? "#888" : "#666",
                                padding: "2px",
                              }}
                              title="Share on X"
                            >
                              𝕏
                            </button>
                            <button
                              onClick={() => shareOnLinkedIn(item)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "700",
                                color: isMobile ? "#888" : "#0077b5",
                                padding: "2px",
                              }}
                              title="Share on LinkedIn"
                            >
                              in
                            </button>
                            <button
                              onClick={() => copyLink(item, setCopiedId)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "14px",
                                color: copiedId === item.id ? "#22c55e" : (isMobile ? "#888" : "#666"),
                                padding: "2px",
                              }}
                              title="Copy link"
                            >
                              {copiedId === item.id ? "✓" : "📋"}
                            </button>
                            <button
                              onClick={() => toggleSave(item)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "14px",
                                opacity: isSaved ? 1 : 0.4,
                                padding: "2px",
                              }}
                              title={isSaved ? "Remove from saved" : "Save article"}
                            >
                              🔖
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: isMobile ? "8px" : "12px",
                    margin: "40px 0",
                    fontSize: "14px",
                    color: isMobile ? "#aaa" : "#666",
                  }}
                >
                  {currentPage > 1 && (
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); prevPage(); }}
                      style={{ color: isMobile ? "#4da3ff" : "#1a0dab", textDecoration: "none" }}
                    >
                      Previous
                    </a>
                  )}

                  {(() => {
                    const pages = [];
                    const maxVisible = isMobile ? 6 : 10;
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                    let endPage = startPage + maxVisible - 1;
                    
                    if (endPage > totalPages) {
                      endPage = totalPages;
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <a
                          key={i}
                          href="#"
                          onClick={(e) => { e.preventDefault(); goToPage(i); }}
                          style={{
                            color: i === currentPage ? (isMobile ? "#fff" : "#333") : (isMobile ? "#4da3ff" : "#1a0dab"),
                            fontWeight: i === currentPage ? "700" : "normal",
                            textDecoration: "none",
                          }}
                        >
                          {i}
                        </a>
                      );
                    }
                    
                    if (endPage < totalPages) {
                      pages.push(<span key="dots">...</span>);
                    }

                    return pages;
                  })()}

                  {currentPage < totalPages && (
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); nextPage(); }}
                      style={{ color: isMobile ? "#4da3ff" : "#1a0dab", textDecoration: "none" }}
                    >
                      Next
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}