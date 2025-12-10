"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Save functionality
  const [savedArticles, setSavedArticles] = useState([]);
  const [showSavedDropdown, setShowSavedDropdown] = useState(false);
  
  // Category dropdown
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Page cache
  const [pageCache, setPageCache] = useState({});

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Load saved from localStorage on mount
  useEffect(() => {
    const storedSaved = localStorage.getItem('savedArticles');
    if (storedSaved) setSavedArticles(JSON.parse(storedSaved));
  }, []);

  // Save article
  const saveArticle = (article) => {
    if (!savedArticles.find(a => a.id === article.id)) {
      const newSaved = [...savedArticles, article];
      setSavedArticles(newSaved);
      localStorage.setItem('savedArticles', JSON.stringify(newSaved));
    }
  };

  // Check if article is saved
  const isArticleSaved = (articleId) => {
    return savedArticles.some(a => a.id === articleId);
  };

  // Remove from saved
  const removeFromSaved = (articleId) => {
    const newSaved = savedArticles.filter(a => a.id !== articleId);
    setSavedArticles(newSaved);
    localStorage.setItem('savedArticles', JSON.stringify(newSaved));
  };

  // Toggle save/unsave
  const toggleSave = (article) => {
    if (isArticleSaved(article.id)) {
      removeFromSaved(article.id);
    } else {
      saveArticle(article);
    }
  };

  // Mark component as mounted and inject mobile styles
  useEffect(() => {
    setHasMounted(true);

    const style = document.createElement('style');
    style.id = 'mobile-dark-bg';
    style.textContent = `
      @media (max-width: 768px) {
        html, body, #__next {
          background: #0d0d0d !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('mobile-dark-bg');
      if (existingStyle) existingStyle.remove();
    };
  }, []);

  // Detect mobile screen
  useEffect(() => {
    if (!hasMounted) return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [hasMounted]);

  // Fetch categories
  useEffect(() => {
    fetch("https://tech-mood-backend-production.up.railway.app/categories")
      .then((res) => res.json())
      .then((json) => setCategories(json.categories || []))
      .catch(() => {});

    calculateTotalPages();
  }, []);

  const calculateTotalPages = () => {
    const countUrl = selectedCategory
      ? `https://tech-mood-backend-production.up.railway.app/articles/count?category=${encodeURIComponent(selectedCategory)}`
      : "https://tech-mood-backend-production.up.railway.app/articles/count";

    fetch(countUrl)
      .then((res) => res.json())
      .then((json) => {
        const total = json.count || 0;
        const pages = Math.ceil(total / 24);
        setTotalPages(pages);
      })
      .catch(() => setTotalPages(1));
  };

  // Prefetch next page in background
  useEffect(() => {
    if (!loading && currentPage < totalPages) {
      const nextPageNum = currentPage; // API is 0-indexed, so page 2 = index 1 = currentPage when on page 1
      const cacheKey = `${selectedCategory || 'all'}-${nextPageNum}`;
      
      if (!pageCache[cacheKey]) {
        const url = selectedCategory
          ? `https://tech-mood-backend-production.up.railway.app/articles/page/${nextPageNum}?category=${encodeURIComponent(selectedCategory)}`
          : `https://tech-mood-backend-production.up.railway.app/articles/page/${nextPageNum}`;
        
        fetch(url)
          .then((res) => res.json())
          .then((json) => {
            const articles = Array.isArray(json.articles) ? json.articles : [];
            setPageCache(prev => ({ ...prev, [cacheKey]: articles }));
            console.log(`Prefetched page ${currentPage + 1}`);
          })
          .catch(() => {});
      }
    }
  }, [loading, currentPage, totalPages, selectedCategory]);

  // Load articles
  const loadArticles = () => {
    const pageNum = currentPage - 1;
    const cacheKey = `${selectedCategory || 'all'}-${pageNum}`;

    if (pageCache[cacheKey]) {
      processArticles(pageCache[cacheKey]);
      return;
    }

    setLoading(true);
    let url;

    if (currentPage === 1) {
      url = selectedCategory
        ? `https://tech-mood-backend-production.up.railway.app/articles?category=${encodeURIComponent(selectedCategory)}`
        : "https://tech-mood-backend-production.up.railway.app/articles";
    } else {
      url = selectedCategory
        ? `https://tech-mood-backend-production.up.railway.app/articles/page/${pageNum}?category=${encodeURIComponent(selectedCategory)}`
        : `https://tech-mood-backend-production.up.railway.app/articles/page/${pageNum}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        const allArticles = Array.isArray(json.articles) ? json.articles : [];
        setPageCache(prev => ({ ...prev, [cacheKey]: allArticles }));
        processArticles(allArticles);
      })
      .catch(() => setLoading(false));
  };

  // Process articles - alternating image/text
  const processArticles = (allArticles) => {
    const isMobileDevice = typeof window !== 'undefined' && window.innerWidth <= 768;
    const articlesPerPage = isMobileDevice ? 12 : 24;
    const halfCount = articlesPerPage / 2;

    // Sort by published_at DESC
    const sorted = allArticles.sort((a, b) => 
      new Date(b.published_at) - new Date(a.published_at)
    );

    const withImages = sorted.filter((a) => a.image_url);
    const withoutImages = sorted.filter((a) => !a.image_url);

    const topImages = withImages.slice(0, halfCount);
    const topText = withoutImages.slice(0, halfCount);

    // Alternate: 4 images, 4 text, 4 images, 4 text... (desktop)
    // Or: 1 image, 1 text, 1 image, 1 text... (mobile)
    const combined = [];
    const chunkSize = isMobileDevice ? 1 : 4;
    const imgChunks = [];
    const txtChunks = [];

    for (let i = 0; i < topImages.length; i += chunkSize) {
      imgChunks.push(topImages.slice(i, i + chunkSize));
    }
    for (let i = 0; i < topText.length; i += chunkSize) {
      txtChunks.push(topText.slice(i, i + chunkSize));
    }

    const maxChunks = Math.max(imgChunks.length, txtChunks.length);
    for (let i = 0; i < maxChunks; i++) {
      if (imgChunks[i]) combined.push(...imgChunks[i]);
      if (txtChunks[i]) combined.push(...txtChunks[i]);
    }

    setArticles(combined);
    setLoading(false);
  };

  // Clear cache when category changes
  useEffect(() => {
    setPageCache({});
  }, [selectedCategory]);

  // Load articles when page or category changes
  useEffect(() => {
    if (hasMounted) {
      loadArticles();
      calculateTotalPages();
    }
  }, [currentPage, selectedCategory, hasMounted]);

  const goToPage = (pageNum) => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setCurrentPage(pageNum);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      window.scrollTo({ top: 0, behavior: "instant" });
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      window.scrollTo({ top: 0, behavior: "instant" });
      setCurrentPage(currentPage - 1);
    }
  };

  // Get sentiment color
  const getBorderColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case "positive": return "#22c55e";
      case "negative": return "#ef4444";
      case "neutral": return "#eab308";
      default: return "#666";
    }
  };

  if (!hasMounted) return null;

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        minHeight: "100vh",
        background: isMobile ? "#0d0d0d" : "#f8f9fa",
        color: isMobile ? "#e0e0e0" : "#333",
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
          {/* Row 1 on Mobile: Logo + Category + Saved */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: isMobile ? "100%" : "auto",
            }}
          >
            {/* Logo + Name */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
              onClick={() => {
                setSelectedCategory(null);
                setCurrentPage(1);
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
              <h1
                style={{
                  fontSize: isMobile ? "18px" : "20px",
                  fontWeight: "700",
                  margin: 0,
                  color: isMobile ? "#ffffff" : "#1a1a1a",
                  whiteSpace: "nowrap",
                }}
              >
                {isMobile ? "TS" : "Tech Sentiments"}
              </h1>
            </div>

            {/* Category & Saved - Always visible on right */}
            {isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* Category Dropdown */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    style={{
                      padding: "6px 10px",
                      fontSize: "12px",
                      background: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: "#e0e0e0",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    🏷️ {selectedCategory || "All"} ▼
                  </button>

                  {showCategoryDropdown && (
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
                        minWidth: "180px",
                      }}
                    >
                      <div
                        onClick={() => { setSelectedCategory(null); setCurrentPage(1); setShowCategoryDropdown(false); }}
                        style={{
                          padding: "10px 15px",
                          cursor: "pointer",
                          borderBottom: "1px solid #333",
                          fontWeight: !selectedCategory ? "600" : "normal",
                          color: "#e0e0e0",
                        }}
                      >
                        All Categories
                      </div>
                      {categories.map((cat) => (
                        <div
                          key={cat}
                          onClick={() => { setSelectedCategory(cat); setCurrentPage(1); setShowCategoryDropdown(false); }}
                          style={{
                            padding: "10px 15px",
                            cursor: "pointer",
                            borderBottom: "1px solid #333",
                            fontWeight: selectedCategory === cat ? "600" : "normal",
                            color: "#e0e0e0",
                          }}
                        >
                          {cat}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Saved Dropdown */}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Category & Saved - Desktop only (already shown on mobile above) */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Category Dropdown */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  style={{
                    padding: "8px 12px",
                    fontSize: "14px",
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    cursor: "pointer",
                    color: "#333",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  🏷️ {selectedCategory || "All"} ▼
                </button>

                {showCategoryDropdown && (
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
                      minWidth: "180px",
                    }}
                  >
                    <div
                      onClick={() => { setSelectedCategory(null); setCurrentPage(1); setShowCategoryDropdown(false); }}
                      style={{
                        padding: "10px 15px",
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                        fontWeight: !selectedCategory ? "600" : "normal",
                        color: "#333",
                      }}
                    >
                      All Categories
                    </div>
                    {categories.map((cat) => (
                      <div
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setCurrentPage(1); setShowCategoryDropdown(false); }}
                        style={{
                          padding: "10px 15px",
                          cursor: "pointer",
                          borderBottom: "1px solid #eee",
                          fontWeight: selectedCategory === cat ? "600" : "normal",
                          color: "#333",
                        }}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved Dropdown */}
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
            </div>
          )}
        </div>
      </header>

      {/* Click outside to close dropdowns */}
      {(showCategoryDropdown || showSavedDropdown) && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99,
          }}
          onClick={() => { setShowCategoryDropdown(false); setShowSavedDropdown(false); }}
        />
      )}

      {/* MAIN CONTENT */}
      <main style={{ padding: isMobile ? "15px" : "20px", maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
            Loading...
          </div>
        )}

        {/* Articles Grid */}
        {!loading && articles.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
              gap: isMobile ? "15px" : "20px",
            }}
          >
            {articles.map((article) => {
              const borderColor = getBorderColor(article.sentiment_label);
              const isSaved = isArticleSaved(article.id);
              const hasImage = !!article.image_url;

              return (
                <div
                  key={article.id}
                  style={{
                    background: isMobile ? "#1a1a1a" : "#fff",
                    borderRadius: "10px",
                    overflow: "hidden",
                    boxShadow: isMobile ? "none" : "0 2px 8px rgba(0,0,0,0.08)",
                    border: isMobile ? "1px solid #2a2a2a" : "1px solid #e8e8e8",
                    borderLeft: `4px solid ${borderColor}`,
                  }}
                >
                  {/* Image */}
                  {hasImage && (
                    <a href={article.source_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={article.image_url}
                        alt=""
                        style={{
                          width: "100%",
                          height: isMobile ? "180px" : "160px",
                          objectFit: "cover",
                        }}
                      />
                    </a>
                  )}

                  {/* Content */}
                  <div style={{ padding: isMobile ? "12px" : "15px" }}>
                    {/* Title */}
                    <a
                      href={article.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: isMobile ? "#fff" : "#1a1a1a",
                        textDecoration: "none",
                        fontSize: isMobile ? "15px" : "14px",
                        fontWeight: "600",
                        lineHeight: "1.4",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        marginBottom: "8px",
                      }}
                    >
                      {article.title}
                    </a>

                    {/* Summary - only for text articles */}
                    {!hasImage && (
                      <p
                        style={{
                          color: isMobile ? "#aaa" : "#666",
                          fontSize: "13px",
                          lineHeight: "1.4",
                          margin: "0 0 10px 0",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {article.summary}
                      </p>
                    )}

                    {/* Meta row */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "auto",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            background: borderColor,
                            color: "#fff",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                          }}
                        >
                          {article.sentiment_label}
                        </span>
                        <span style={{ fontSize: "11px", color: isMobile ? "#888" : "#999" }}>
                          {getSourceName(article.source_url)}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleSave(article)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "16px",
                          opacity: isSaved ? 1 : 0.4,
                        }}
                      >
                        🔖
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination - Google Style */}
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
            
            // Calculate start and end pages (sliding window)
            let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            let endPage = startPage + maxVisible - 1;
            
            // Adjust if we're near the end
            if (endPage > totalPages) {
              endPage = totalPages;
              startPage = Math.max(1, endPage - maxVisible + 1);
            }
            
            // Render page numbers
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
            
            // Add "..." if there are more pages after
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
      </main>
    </div>
  );
}