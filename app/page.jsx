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

// Get relative time (e.g., "2h", "3d", "1w")
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
  return ""; // Over 30 days - show nothing
}

export default function Home() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [isLoadingAutocomplete, setIsLoadingAutocomplete] = useState(false);

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
      // Save to recent searches
      const query = searchQuery.trim().toLowerCase();
      const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      setShowSearchDropdown(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Load saved articles and recent searches from localStorage on mount
  useEffect(() => {
    const storedSaved = localStorage.getItem('savedArticles');
    if (storedSaved) setSavedArticles(JSON.parse(storedSaved));
    
    const storedSearches = localStorage.getItem('recentSearches');
    if (storedSearches) setRecentSearches(JSON.parse(storedSearches));
  }, []);

  // Autocomplete - fetch suggestions as user types
  useEffect(() => {
    if (searchQuery.length < 2) {
      setAutocompleteResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoadingAutocomplete(true);
      fetch(`https://tech-mood-backend-production.up.railway.app/autocomplete?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          setAutocompleteResults(data.suggestions || []);
          setIsLoadingAutocomplete(false);
        })
        .catch(() => {
          setAutocompleteResults([]);
          setIsLoadingAutocomplete(false);
        });
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle clicking a suggestion
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSearchDropdown(false);
    // Save to recent and navigate
    const updated = [suggestion, ...recentSearches.filter(q => q !== suggestion)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

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
    // Get count from both endpoints (24 articles per page = 12 images + 12 text)
    const categoryParam = selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : "";
    const sourceParam = selectedSource ? `&source=${encodeURIComponent(selectedSource)}` : "";
    
    // Fetch both counts in parallel
    Promise.all([
      fetch(`https://tech-mood-backend-production.up.railway.app/articles/images?page=0&limit=1${categoryParam}${sourceParam}`),
      fetch(`https://tech-mood-backend-production.up.railway.app/articles/text?page=0&limit=1${categoryParam}${sourceParam}`)
    ])
      .then(([imgRes, txtRes]) => Promise.all([imgRes.json(), txtRes.json()]))
      .then(([imgJson, txtJson]) => {
        const imageCount = imgJson.count || 0;
        const textCount = txtJson.count || 0;
        // Use the larger count for pagination (whichever has more articles)
        const maxCount = Math.max(imageCount, textCount);
        const pages = Math.max(1, Math.ceil(maxCount / 12));
        setTotalPages(pages);
      })
      .catch(() => setTotalPages(1));
  };

  // Prefetch next page in background
  useEffect(() => {
    if (!loading && currentPage < totalPages) {
      const nextPage = currentPage; // currentPage is 1-indexed, API is 0-indexed
      const cacheKey = `${selectedCategory || 'all'}-${selectedSource || 'all'}-${nextPage}`;
      
      if (!pageCache[cacheKey]) {
        const categoryParam = selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : "";
        const sourceParam = selectedSource ? `&source=${encodeURIComponent(selectedSource)}` : "";
        const limit = 12; // Always 12 images + 12 text = 24 articles
        
        // Prefetch both endpoints in parallel
        Promise.all([
          fetch(`https://tech-mood-backend-production.up.railway.app/articles/images?page=${nextPage}&limit=${limit}${categoryParam}${sourceParam}`),
          fetch(`https://tech-mood-backend-production.up.railway.app/articles/text?page=${nextPage}&limit=${limit}${categoryParam}${sourceParam}`)
        ])
          .then(([imgRes, txtRes]) => Promise.all([imgRes.json(), txtRes.json()]))
          .then(([imgJson, txtJson]) => {
            const combined = {
              images: imgJson.articles || [],
              text: txtJson.articles || []
            };
            setPageCache(prev => ({ ...prev, [cacheKey]: combined }));
            console.log(`Prefetched page ${currentPage + 1}`);
          })
          .catch(() => {});
      }
    }
  }, [loading, currentPage, totalPages, selectedCategory, selectedSource]);

  // Load articles
  const loadArticles = (mobileView) => {
    const pageNum = currentPage - 1; // API is 0-indexed
    const cacheKey = `${selectedCategory || 'all'}-${selectedSource || 'all'}-${pageNum}`;

    if (pageCache[cacheKey]) {
      processArticles(pageCache[cacheKey], mobileView);
      return;
    }

    setLoading(true);
    
    const categoryParam = selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : "";
    const sourceParam = selectedSource ? `&source=${encodeURIComponent(selectedSource)}` : "";
    const limit = 12; // Always 12 images + 12 text = 24 articles

    // Fetch both endpoints in parallel
    Promise.all([
      fetch(`https://tech-mood-backend-production.up.railway.app/articles/images?page=${pageNum}&limit=${limit}${categoryParam}${sourceParam}`),
      fetch(`https://tech-mood-backend-production.up.railway.app/articles/text?page=${pageNum}&limit=${limit}${categoryParam}${sourceParam}`)
    ])
      .then(([imgRes, txtRes]) => Promise.all([imgRes.json(), txtRes.json()]))
      .then(([imgJson, txtJson]) => {
        const combined = {
          images: imgJson.articles || [],
          text: txtJson.articles || []
        };
        setPageCache(prev => ({ ...prev, [cacheKey]: combined }));
        processArticles(combined, mobileView);
      })
      .catch(() => setLoading(false));
  };

  // Process articles - alternating image/text
  const processArticles = (data, mobileView = false) => {
    const imageArticles = data.images || [];
    const textArticles = data.text || [];
    const combined = [];

    if (mobileView) {
      // Mobile: Alternate 1 image, 1 text for a cleaner feed
      const maxLen = Math.max(imageArticles.length, textArticles.length);
      for (let i = 0; i < maxLen; i++) {
        if (imageArticles[i]) combined.push(imageArticles[i]);
        if (textArticles[i]) combined.push(textArticles[i]);
      }
    } else {
      // Desktop: Alternate in chunks of 4 for grid layout
      const chunkSize = 4;
      const imgChunks = [];
      const txtChunks = [];

      for (let i = 0; i < imageArticles.length; i += chunkSize) {
        imgChunks.push(imageArticles.slice(i, i + chunkSize));
      }
      for (let i = 0; i < textArticles.length; i += chunkSize) {
        txtChunks.push(textArticles.slice(i, i + chunkSize));
      }

      const maxChunks = Math.max(imgChunks.length, txtChunks.length);
      for (let i = 0; i < maxChunks; i++) {
        if (imgChunks[i]) combined.push(...imgChunks[i]);
        if (txtChunks[i]) combined.push(...txtChunks[i]);
      }
    }

    setArticles(combined);
    setLoading(false);
  };

  // Clear cache when category or source changes
  useEffect(() => {
    setPageCache({});
  }, [selectedCategory, selectedSource]);

  // Load articles when page or category or source or mobile state changes
  useEffect(() => {
    if (hasMounted) {
      loadArticles(isMobile);
      calculateTotalPages();
    }
  }, [currentPage, selectedCategory, selectedSource, hasMounted, isMobile]);

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
          zIndex: 1000,
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
           
            {/* Source Filter, Category & Saved - Always visible on right */}
            {isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* Source Filter - Only show when active */}
                {selectedSource && (
                  <div
                    style={{
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span style={{ color: "#3b82f6" }}>{selectedSource}</span>
                    <span
                      onClick={() => setSelectedSource(null)}
                      style={{
                        cursor: "pointer",
                        color: "#888",
                      }}
                    >
                      ✕
                    </span>
                  </div>
                )}

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
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              position: "relative",
            }}
          >
            <div style={{ position: "relative", width: "100%", minWidth: 0 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
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

              {/* Search Dropdown - Recent & Autocomplete */}
              {showSearchDropdown && (recentSearches.length > 0 || autocompleteResults.length > 0 || isLoadingAutocomplete) && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "4px",
                    background: isMobile ? "#1a1a1a" : "#fff",
                    border: isMobile ? "1px solid #333" : "1px solid #ddd",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 1001,
                    maxHeight: "300px",
                    overflow: "auto",
                  }}
                >
                  {/* Autocomplete Results */}
                  {searchQuery.length >= 2 && autocompleteResults.length > 0 && (
                    <>
                      <div style={{ 
                        padding: "8px 12px", 
                        fontSize: "11px", 
                        color: isMobile ? "#888" : "#666",
                        borderBottom: isMobile ? "1px solid #333" : "1px solid #eee"
                      }}>
                        Suggestions
                      </div>
                      {autocompleteResults.map((suggestion, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          style={{
                            padding: "10px 12px",
                            cursor: "pointer",
                            borderBottom: isMobile ? "1px solid #333" : "1px solid #eee",
                            color: isMobile ? "#e0e0e0" : "#333",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                          onMouseEnter={(e) => e.target.style.background = isMobile ? "#333" : "#f5f5f5"}
                          onMouseLeave={(e) => e.target.style.background = "transparent"}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </>
                  )}

                  {/* Recent Searches */}
                  {searchQuery.length < 2 && recentSearches.length > 0 && (
                    <>
                      <div style={{ 
                        padding: "8px 12px", 
                        fontSize: "11px", 
                        color: isMobile ? "#888" : "#666",
                        borderBottom: isMobile ? "1px solid #333" : "1px solid #eee",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span>Recent Searches</span>
                        <button
                          onClick={(e) => { e.preventDefault(); clearRecentSearches(); }}
                          style={{
                            background: "none",
                            border: "none",
                            color: isMobile ? "#4da3ff" : "#1a0dab",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          Clear
                        </button>
                      </div>
                      {recentSearches.map((query, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSuggestionClick(query)}
                          style={{
                            padding: "10px 12px",
                            cursor: "pointer",
                            borderBottom: isMobile ? "1px solid #333" : "1px solid #eee",
                            color: isMobile ? "#e0e0e0" : "#333",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                          onMouseEnter={(e) => e.target.style.background = isMobile ? "#333" : "#f5f5f5"}
                          onMouseLeave={(e) => e.target.style.background = "transparent"}
                        >
                          {query}
                        </div>
                      ))}
                    </>
                  )}

                  {/* Loading */}
                  {isLoadingAutocomplete && searchQuery.length >= 2 && (
                    <div style={{ padding: "12px", textAlign: "center", color: "#888" }}>
                      Loading...
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>

          {/* Source Filter, Category & Saved - Desktop only (already shown on mobile above) */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Source Filter - Only show when active */}
              {selectedSource && (
                <div
                  style={{
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span style={{ color: "#1976d2" }}>{selectedSource}</span>
                  <span
                    onClick={() => setSelectedSource(null)}
                    style={{
                      cursor: "pointer",
                      color: "#888",
                    }}
                  >
                    ✕
                  </span>
                </div>
              )}

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
      {(showCategoryDropdown || showSavedDropdown || showSearchDropdown) && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99,
          }}
          onClick={() => { setShowCategoryDropdown(false); setShowSavedDropdown(false); setShowSearchDropdown(false); }}
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
                    borderTop: isMobile ? "1px solid #2a2a2a" : "1px solid #e8e8e8",
                    borderRight: isMobile ? "1px solid #2a2a2a" : "1px solid #e8e8e8",
                    borderBottom: isMobile ? "1px solid #2a2a2a" : "1px solid #e8e8e8",
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
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSource(getSourceName(article.source_url));
                              setCurrentPage(1);
                            }}
                            style={{
                              cursor: "pointer",
                              transition: "color 0.2s",
                            }}
                            onMouseEnter={(e) => e.target.style.color = isMobile ? "#3b82f6" : "#1976d2"}
                            onMouseLeave={(e) => e.target.style.color = isMobile ? "#888" : "#999"}
                          >
                            {getSourceName(article.source_url)}
                          </span>
                          {getTimeAgo(article.published_at) && ` • ${getTimeAgo(article.published_at)}`}
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

        {/* 
  EMAIL SUBSCRIBE FOOTER
  Add this just before the closing </main> tag in your page.jsx
*/}

{/* Footer */}
<footer
  style={{
    background: isMobile ? "#0a0a0a" : "#1a1a1a",
    borderTop: isMobile ? "1px solid #222" : "1px solid #333",
    padding: isMobile ? "30px 15px" : "40px 20px",
    marginTop: "40px",
  }}
>
  <div
    style={{
      maxWidth: "600px",
      margin: "0 auto",
      textAlign: "center",
    }}
  >
    <h3
      style={{
        color: "#fff",
        fontSize: isMobile ? "18px" : "20px",
        fontWeight: "600",
        marginBottom: "8px",
      }}
    >
      Stay Updated
    </h3>
    <p
      style={{
        color: "#888",
        fontSize: "14px",
        marginBottom: "20px",
      }}
    >
      Get weekly tech sentiment insights delivered to your inbox
    </p>

    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.target;
        const email = form.email.value;
        const button = form.querySelector('button');
        const originalText = button.innerText;
        
        button.innerText = "Subscribing...";
        button.disabled = true;

        try {
          const res = await fetch("https://tech-mood-backend-production.up.railway.app/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          
          if (data.success) {
            button.innerText = "✓ Subscribed!";
            button.style.background = "#22c55e";
            form.email.value = "";
            setTimeout(() => {
              button.innerText = originalText;
              button.style.background = "#3b82f6";
              button.disabled = false;
            }, 3000);
          } else {
            button.innerText = data.message || "Try again";
            button.style.background = "#ef4444";
            setTimeout(() => {
              button.innerText = originalText;
              button.style.background = "#3b82f6";
              button.disabled = false;
            }, 2000);
          }
        } catch (err) {
          button.innerText = "Error - Try again";
          button.style.background = "#ef4444";
          setTimeout(() => {
            button.innerText = originalText;
            button.style.background = "#3b82f6";
            button.disabled = false;
          }, 2000);
        }
      }}
      style={{
        display: "flex",
        gap: "10px",
        justifyContent: "center",
        flexDirection: isMobile ? "column" : "row",
        maxWidth: "400px",
        margin: "0 auto",
      }}
    >
      <input
        type="email"
        name="email"
        placeholder="Enter your email"
        required
        style={{
          flex: 1,
          padding: "12px 16px",
          borderRadius: "8px",
          border: "1px solid #333",
          background: "#2a2a2a",
          color: "#fff",
          fontSize: "14px",
          outline: "none",
        }}
      />
      <button
        type="submit"
        style={{
          padding: "12px 24px",
          borderRadius: "8px",
          border: "none",
          background: "#3b82f6",
          color: "#fff",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "background 0.2s",
          whiteSpace: "nowrap",
        }}
      >
        Subscribe
      </button>
    </form>

    <p
      style={{
        color: "#555",
        fontSize: "12px",
        marginTop: "20px",
      }}
    >
      © 2025 TechSentiments • No spam, unsubscribe anytime
    </p>
  </div>
</footer>
        
      </main>



      
    </div>
  );
}