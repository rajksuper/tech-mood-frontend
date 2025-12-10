"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [correctedQuery, setCorrectedQuery] = useState(null);
  const [activeSearchTerm, setActiveSearchTerm] = useState(null);

  // Save functionality
  const [savedArticles, setSavedArticles] = useState([]);
  const [showSavedDropdown, setShowSavedDropdown] = useState(false);

  // Mark component as mounted and inject mobile styles
  useEffect(() => {
    setHasMounted(true);

    const style = document.createElement('style');
    style.id = 'search-mobile-dark-bg';
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
      const existingStyle = document.getElementById('search-mobile-dark-bg');
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
  
  const toggleSave = (article) => {
    let newSaved;
    if (isArticleSaved(article.id)) {
      newSaved = savedArticles.filter(a => a.id !== article.id);
    } else {
      newSaved = [...savedArticles, article];
    }
    setSavedArticles(newSaved);
    localStorage.setItem('savedArticles', JSON.stringify(newSaved));
  };

  const removeFromSaved = (articleId) => {
    const newSaved = savedArticles.filter(a => a.id !== articleId);
    setSavedArticles(newSaved);
    localStorage.setItem('savedArticles', JSON.stringify(newSaved));
  };

  // Detect mobile screen
  useEffect(() => {
    if (!hasMounted) return;
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [hasMounted]);

  // Search when query changes
  useEffect(() => {
    if (query) {
      performSearch(query, 0);
    }
  }, [query]);

  const performSearch = async (searchQuery, page) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(
        `https://tech-mood-backend-production.up.railway.app/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=50`
      );
      const json = await res.json();
      
      setArticles(json.articles || []);
      setTotalCount(json.count || 0);
      setHasMore(json.has_more || false);
      setCurrentPage(page);
      setCorrectedQuery(json.corrected_query || null);
      
      if (json.corrected_query) {
        setActiveSearchTerm(json.corrected_query);
      } else if (page === 0) {
        setActiveSearchTerm(searchQuery.toLowerCase());
      }
      
      // Prefetch next page
      if (json.has_more) {
        const prefetchTerm = json.corrected_query || searchQuery;
        fetch(
          `https://tech-mood-backend-production.up.railway.app/search?q=${encodeURIComponent(prefetchTerm)}&page=${page + 1}&limit=50`
        ).catch(() => {});
      }
    } catch (err) {
      console.error("Search error:", err);
      setArticles([]);
      setCorrectedQuery(null);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      window.history.pushState({}, "", `/search?q=${encodeURIComponent(searchInput)}`);
      performSearch(searchInput, 0);
    }
  };

  const nextPage = () => {
    const searchTerm = activeSearchTerm || correctedQuery || query || searchInput;
    window.scrollTo({ top: 0, behavior: "instant" });
    performSearch(searchTerm, currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 0) {
      const searchTerm = activeSearchTerm || correctedQuery || query || searchInput;
      window.scrollTo({ top: 0, behavior: "instant" });
      performSearch(searchTerm, currentPage - 1);
    }
  };

  const getBorderColor = (sentiment) => {
    if (sentiment === "positive") return "green";
    if (sentiment === "negative") return "red";
    if (sentiment === "mixed") return "#a855f7";
    return "#e6b800";
  };

  if (!hasMounted) return null;

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
      {/* HEADER */}
      <header
        style={{
          padding: isMobile ? "12px 15px" : "12px 20px",
          background: isMobile ? "#0d0d0d" : "white",
          borderBottom: isMobile ? "1px solid #222" : "1px solid #e0e0e0",
          position: "sticky",
          top: 0,
          zIndex: 100,
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
                      savedArticles.map((article) => (
                        <div
                          key={article.id}
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
                            href={article.source_url}
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
                            {article.title}
                          </a>
                          <button
                            onClick={() => removeFromSaved(article.id)}
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
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative", width: "100%" }}>
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
                  fontSize: "13px",
                  border: isMobile ? "1px solid #333" : "1px solid #ddd",
                  borderRadius: "25px",
                  background: isMobile ? "#1a1a1a" : "#fff",
                  color: isMobile ? "#e0e0e0" : "#333",
                  outline: "none",
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
                    savedArticles.map((article) => (
                      <div
                        key={article.id}
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
                          href={article.source_url}
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
                          {article.title}
                        </a>
                        <button
                          onClick={() => removeFromSaved(article.id)}
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

      {/* MAIN CONTENT */}
      <div style={{ padding: isMobile ? "15px" : "20px", maxWidth: "1000px", margin: "0 auto" }}>
        
        {/* Results Info */}
        {query && !loading && (
          <div style={{ marginBottom: "20px" }}>
            {correctedQuery && (
              <p style={{ 
                color: isMobile ? "#4da3ff" : "#0066cc", 
                marginBottom: "8px",
                fontSize: "14px" 
              }}>
                🤖 Showing results for "<strong>{correctedQuery}</strong>"
              </p>
            )}
            <p style={{ color: isMobile ? "#aaa" : "#666" }}>
              {totalCount > 0
                ? `Found ${totalCount} results for "${correctedQuery || query}"`
                : `No results found for "${correctedQuery || query}"`}
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <p style={{ textAlign: "center", padding: "40px", color: isMobile ? "#aaa" : "#666" }}>
            Searching...
          </p>
        )}

        {/* Results - Original List Layout */}
        {!loading && articles.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {articles.map((item) => {
              const borderColor = getBorderColor(item.sentiment_label);

              return (
                <div
                  key={item.id}
                  style={{
                    borderLeft: `6px solid ${borderColor}`,
                    borderRadius: "8px",
                    padding: "16px 20px",
                    background: isMobile ? "#1a1a1a" : "white",
                    display: "flex",
                    gap: "20px",
                    alignItems: isMobile ? "flex-start" : "center",
                    flexDirection: isMobile ? "column" : "row",
                    boxShadow: isMobile ? "none" : "0 2px 6px rgba(0,0,0,0.08)",
                  }}
                >
                  {/* Image or Placeholder */}
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt="thumbnail"
                      style={{
                        width: isMobile ? "100%" : "140px",
                        height: isMobile ? "180px" : "90px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: isMobile ? "100%" : "140px",
                        height: isMobile ? "80px" : "90px",
                        borderRadius: "6px",
                        background: isMobile
                          ? `linear-gradient(135deg, ${borderColor}30, ${borderColor}50)`
                          : `linear-gradient(135deg, ${borderColor}20, ${borderColor}40)`,
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
                        color: isMobile ? "#4da3ff" : "#1a0dab",
                        textDecoration: "none",
                        fontSize: "18px",
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
                        color: isMobile ? "#bbb" : "#555",
                        fontSize: "14px",
                        marginBottom: "10px",
                        lineHeight: "1.5",
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
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "13px",
                        color: isMobile ? "#888" : "#888",
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ color: isMobile ? "#4da3ff" : "#0066cc" }}>
                        {getSourceName(item.source_url)}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(item.published_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span
                        style={{
                          background: borderColor,
                          color: "white",
                          padding: "2px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
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
                              background: isMobile ? "#333" : "#f0f0f0",
                              padding: "2px 10px",
                              borderRadius: "12px",
                              fontSize: "11px",
                            }}
                          >
                            {item.category}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && articles.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              marginTop: "40px",
              marginBottom: "40px",
            }}
          >
            {currentPage > 0 && (
              <button
                onClick={prevPage}
                style={{
                  padding: "10px 24px",
                  background: isMobile ? "#333" : "#f0f0f0",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: isMobile ? "#e0e0e0" : "#333",
                }}
              >
                ← Previous
              </button>
            )}
            {hasMore && (
              <button
                onClick={nextPage}
                style={{
                  padding: "10px 24px",
                  background: isMobile ? "#4da3ff" : "#0066cc",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Next →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}