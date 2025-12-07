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
      
      const allArticles = json.articles || [];
      
      // Separate articles with and without images
      const withImages = allArticles.filter(a => a.image_url);
      const withoutImages = allArticles.filter(a => !a.image_url);
      
      // Alternate: image, no-image, image, no-image...
      const alternated = [];
      const maxLen = Math.max(withImages.length, withoutImages.length);
      
      for (let i = 0; i < maxLen && alternated.length < 24; i++) {
        if (withImages[i]) alternated.push(withImages[i]);
        if (withoutImages[i] && alternated.length < 24) alternated.push(withoutImages[i]);
      }
      
      // If we don't have 24 yet, fill with remaining
      if (alternated.length < 24) {
        const remaining = allArticles.filter(a => !alternated.includes(a));
        alternated.push(...remaining.slice(0, 24 - alternated.length));
      }
      
      setArticles(alternated.slice(0, 24));
      setTotalCount(json.count || 0);
      setHasMore(json.has_more || false);
      setCurrentPage(page);
      setCorrectedQuery(json.corrected_query || null);
      
      // Store the corrected query for pagination
      if (json.corrected_query) {
        setActiveSearchTerm(json.corrected_query);
      } else if (page === 0) {
        setActiveSearchTerm(searchQuery.toLowerCase());
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
    // Use corrected query for pagination
    const searchTerm = activeSearchTerm || correctedQuery || query || searchInput;
    performSearch(searchTerm, currentPage + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevPage = () => {
    if (currentPage > 0) {
      // Use corrected query for pagination
      const searchTerm = activeSearchTerm || correctedQuery || query || searchInput;
      performSearch(searchTerm, currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getBorderColor = (sentiment) => {
    if (sentiment === "positive") return "green";
    if (sentiment === "negative") return "red";
    if (sentiment === "mixed") return "#a855f7";
    return "#e6b800";
  };

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        minHeight: "100vh",
        background: isMobile ? "#0d0d0d" : "white",
        color: isMobile ? "#e0e0e0" : "inherit",
        overflowX: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: isMobile ? "15px" : "20px", maxWidth: "1000px", margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            color: isMobile ? "#4da3ff" : "#0066cc",
            textDecoration: "none",
            fontSize: "14px",
            display: "inline-block",
            marginBottom: "16px",
          }}
        >
          ← Back to Home
        </Link>

        <h1 style={{ fontSize: isMobile ? "24px" : "32px", marginBottom: "20px" }}>
          Search Articles
        </h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} style={{ marginBottom: "30px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for NVIDIA, Bitcoin, AI, etc..."
              style={{
                flex: 1,
                padding: "14px 18px",
                fontSize: "16px",
                border: isMobile ? "1px solid #444" : "2px solid #ddd",
                borderRadius: "8px",
                background: isMobile ? "#1a1a1a" : "white",
                color: isMobile ? "#e0e0e0" : "#333",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "14px 28px",
                fontSize: "16px",
                background: "#0066cc",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Search
            </button>
          </div>
        </form>

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

        {/* Results */}
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
                        margin: "0 0 10px",
                        color: isMobile ? "#aaa" : "#555",
                        fontSize: "14px",
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
                        fontSize: "12px",
                        color: isMobile ? "#888" : "#666",
                        flexWrap: "wrap",
                      }}
                    >
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: isMobile ? "#4da3ff" : "#0066cc",
                          textDecoration: "none",
                          fontWeight: "500",
                        }}
                      >
                        {getSourceName(item.source_url)}
                      </a>
                      <span style={{ color: isMobile ? "#555" : "#ccc" }}>•</span>
                      <span>
                        {item.published_at
                          ? new Date(item.published_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : ""}
                      </span>
                      {item.category && (
                        <>
                          <span style={{ color: isMobile ? "#555" : "#ccc" }}>•</span>
                          <span
                            style={{
                              background: isMobile ? "#2a2a2a" : "#f0f0f0",
                              padding: "2px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            {item.category}
                          </span>
                        </>
                      )}
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
                      alignSelf: isMobile ? "flex-start" : "center",
                    }}
                  >
                    {item.sentiment_label}
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
              alignItems: "center",
              gap: "20px",
              margin: "40px 0",
              fontSize: "16px",
            }}
          >
            {currentPage > 0 && (
              <button
                onClick={prevPage}
                style={{
                  padding: "10px 20px",
                  background: isMobile ? "#2a2a2a" : "#f0f0f0",
                  border: isMobile ? "1px solid #444" : "1px solid #ddd",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: isMobile ? "#e0e0e0" : "#333",
                  fontWeight: "500",
                }}
              >
                ← Previous
              </button>
            )}

            <span style={{ color: isMobile ? "#aaa" : "#666" }}>
              Page {currentPage + 1}
            </span>

            {hasMore && (
              <button
                onClick={nextPage}
                style={{
                  padding: "10px 20px",
                  background: "#0066cc",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: "white",
                  fontWeight: "500",
                }}
              >
                Next →
              </button>
            )}
          </div>
        )}

        {/* No Results */}
        {!loading && query && articles.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: isMobile ? "#888" : "#666",
            }}
          >
            <p style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</p>
            <p style={{ fontSize: "18px", marginBottom: "8px" }}>No articles found</p>
            <p style={{ fontSize: "14px" }}>Try different keywords like "NVIDIA", "Bitcoin", or "AI"</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}