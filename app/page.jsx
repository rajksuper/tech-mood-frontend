"use client";
import { useState, useEffect, useRef } from "react";
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
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [listArticles, setListArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const scrollPositionRef = useRef(0);
  const isTopPaginationRef = useRef(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Save functionality only
  const [savedArticles, setSavedArticles] = useState([]);
  const [showSavedDropdown, setShowSavedDropdown] = useState(false);

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

  // Save article (bookmark only, doesn't hide)
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

  // Prefetch cache for faster page loads
  const [pageCache, setPageCache] = useState({});

  useEffect(() => {
    loadArticles();
    calculateTotalPages();
  }, [selectedCategory, currentPage]);

  // Prefetch next page after current page loads
  useEffect(() => {
    if (!loading && currentPage < totalPages) {
      const nextPageNum = currentPage;
      const cacheKey = `${selectedCategory || 'all'}-${nextPageNum}`;
      
      // Only prefetch if not already cached
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

  // Restore scroll position after loading
  useEffect(() => {
    if (!loading && isTopPaginationRef.current) {
      window.scrollTo(0, scrollPositionRef.current);
      isTopPaginationRef.current = false;
    }
  }, [loading]);

  // Auto-play carousel
  useEffect(() => {
    if (isHovered) return;
    if (!featuredArticles.length) return;

    const slideInterval = isMobile ? 10000 : 5000;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredArticles.length);
    }, slideInterval);

    return () => clearInterval(interval);
  }, [featuredArticles.length, isHovered, isMobile]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "ArrowRight") {
        nextSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [featuredArticles.length]);

  const loadArticles = () => {
    setCurrentSlide(0);

    const pageNum = currentPage - 1;
    const cacheKey = `${selectedCategory || 'all'}-${pageNum}`;

    // Check if we have cached data
    if (pageCache[cacheKey]) {
      console.log(`Using cached page ${currentPage}`);
      const allArticles = pageCache[cacheKey];
      processArticles(allArticles);
      return;
    }

    // No cache, fetch from API
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
        
        // Cache this page
        setPageCache(prev => ({ ...prev, [cacheKey]: allArticles }));
        
        processArticles(allArticles);
      })
      .catch(() => setLoading(false));
  };

  // Process and display articles
  const processArticles = (allArticles) => {
    // Sort by published_at DESC (newest first)
    const sorted = allArticles.sort((a, b) => 
      new Date(b.published_at) - new Date(a.published_at)
    );

    // Separate: articles with images vs without
    const withImages = sorted.filter((a) => a.image_url);
    const withoutImages = sorted.filter((a) => !a.image_url);

    // Take first 12 of each (newest), then shuffle for display variety
    const top12Images = withImages.slice(0, 12).sort(() => Math.random() - 0.5);
    const top12Text = withoutImages.slice(0, 12).sort(() => Math.random() - 0.5);

    setFeaturedArticles(top12Images);
    setListArticles(top12Text);
    setLoading(false);
  };

  // Clear cache when category changes
  useEffect(() => {
    setPageCache({});
  }, [selectedCategory]);

  const goToPageTop = (pageNum) => {
    scrollPositionRef.current = window.scrollY;
    isTopPaginationRef.current = true;
    setCurrentPage(pageNum);
  };

  const goToPageBottom = (pageNum) => {
    isTopPaginationRef.current = false;
    setCurrentPage(pageNum);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  const nextPageTop = () => {
    if (currentPage < totalPages) {
      scrollPositionRef.current = window.scrollY;
      isTopPaginationRef.current = true;
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPageTop = () => {
    if (currentPage > 1) {
      scrollPositionRef.current = window.scrollY;
      isTopPaginationRef.current = true;
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPageBottom = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  };

  const prevPageBottom = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  };

  const getBorderColor = (sentiment) => {
    if (sentiment === "positive") return "green";
    if (sentiment === "negative") return "red";
    if (sentiment === "mixed") return "#a855f7";
    return "#e6b800";
  };

  const nextSlide = () => {
    if (!featuredArticles.length) return;
    setCurrentSlide((prev) => (prev + 1) % featuredArticles.length);
  };

  const prevSlide = () => {
    if (!featuredArticles.length) return;
    setCurrentSlide((prev) => (prev - 1 + featuredArticles.length) % featuredArticles.length);
  };

  // Touch swipe support
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
    const deltaX = Math.abs(e.touches[0].clientX - touchStart);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
    if (isMobile && deltaX > deltaY) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      nextSlide();
    }
    if (touchStart - touchEnd < -75) {
      prevSlide();
    }
  };

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        minHeight: isMobile ? "100vh" : "auto",
        background: isMobile ? "#0d0d0d" : "white",
        color: isMobile ? "#e0e0e0" : "inherit",
      }}
    >
      {/* HEADER */}
      <div style={{ padding: "20px", maxWidth: "1600px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ fontSize: isMobile ? "22px" : "32px", marginBottom: "8px" }}>
              Tech Mood Dashboard
            </h3>
            <h3
              style={{
                color: isMobile ? "#bbbbbb" : "#666",
                fontWeight: "normal",
                marginBottom: "12px",
                fontSize: isMobile ? "11px" : "16px",
                lineHeight: "1.2",
                whiteSpace: isMobile ? "nowrap" : "normal",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {/* Real-time sentiment analysis of technology news*/}
            </h3>
          </div>

          {/* SAVED BUTTON */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowSavedDropdown(!showSavedDropdown)}
              style={{
                background: isMobile ? "#2a2a2a" : "#f0f0f0",
                border: isMobile ? "1px solid #444" : "1px solid #ddd",
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "14px",
                color: isMobile ? "#e0e0e0" : "#333",
              }}
            >
              🔖 <span style={{ fontWeight: "600" }}>{savedArticles.length}</span>
            </button>

            {/* SAVED DROPDOWN */}
            {showSavedDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "45px",
                  right: "0",
                  width: isMobile ? "300px" : "400px",
                  maxHeight: "500px",
                  overflowY: "auto",
                  background: isMobile ? "#1a1a1a" : "white",
                  border: isMobile ? "1px solid #333" : "1px solid #ddd",
                  borderRadius: "8px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: isMobile ? "1px solid #333" : "1px solid #eee",
                    fontWeight: "600",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>Saved Articles ({savedArticles.length})</span>
                  <button
                    onClick={() => setShowSavedDropdown(false)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "18px",
                      cursor: "pointer",
                      color: isMobile ? "#aaa" : "#666",
                    }}
                  >
                    ✕
                  </button>
                </div>

                {savedArticles.length === 0 ? (
                  <div style={{ padding: "30px", textAlign: "center", color: isMobile ? "#888" : "#999" }}>
                    No saved articles yet
                  </div>
                ) : (
                  savedArticles.map((article) => (
                    <div
                      key={article.id}
                      style={{
                        padding: "12px 16px",
                        borderBottom: isMobile ? "1px solid #333" : "1px solid #eee",
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-start",
                      }}
                    >
                      <button
                        onClick={() => removeFromSaved(article.id)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "14px",
                          cursor: "pointer",
                          color: isMobile ? "#ff6b6b" : "#dc3545",
                          padding: "0",
                          marginTop: "2px",
                        }}
                        title="Remove from saved"
                      >
                        ✕
                      </button>
                      <div style={{ flex: 1 }}>
                        <a
                          href={article.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: isMobile ? "#4da3ff" : "#0066cc",
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: "500",
                            lineHeight: "1.4",
                            display: "block",
                          }}
                        >
                          {article.title}
                        </a>
                        <div style={{ fontSize: "11px", color: isMobile ? "#888" : "#999", marginTop: "4px" }}>
                          {getSourceName(article.source_url)} • {article.category}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* CATEGORY PILLS */}
        <div
          style={{
            marginBottom: "15px",
            display: "flex",
            gap: isMobile ? "6px" : "8px",
            overflowX: "auto",
            whiteSpace: "nowrap",
            paddingBottom: "8px",
          }}
        >
          <div
            onClick={() => {
              setSelectedCategory(null);
              setCurrentPage(1);
            }}
            style={{
              padding: isMobile ? "4px 8px" : "6px 12px",
              fontSize: isMobile ? "11px" : "12px",
              background: isMobile
                ? selectedCategory === null ? "#3a3a3a" : "#2a2a2a"
                : selectedCategory === null ? "#0066cc" : "white",
              color: isMobile
                ? "#e0e0e0"
                : selectedCategory === null ? "white" : "#333",
              border: isMobile ? "1px solid #444" : "1px solid #0066cc",
              borderRadius: isMobile ? "4px" : "15px",
              cursor: "pointer",
              fontWeight: "600",
              display: "inline-block",
            }}
          >
            All
          </div>

          {categories.map((cat) => (
            <div
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              style={{
                padding: isMobile ? "4px 8px" : "6px 12px",
                fontSize: isMobile ? "11px" : "12px",
                background: isMobile
                  ? selectedCategory === cat ? "#3a3a3a" : "#2a2a2a"
                  : selectedCategory === cat ? "#0066cc" : "white",
                color: isMobile
                  ? "#e0e0e0"
                  : selectedCategory === cat ? "white" : "#333",
                border: isMobile ? "1px solid #444" : "1px solid #0066cc",
                borderRadius: isMobile ? "4px" : "15px",
                cursor: "pointer",
                fontWeight: "600",
                display: "inline-block",
              }}
            >
              {cat}
            </div>
          ))}
        </div>

        {/* SEARCH BAR - Full width like search page */}
        <form onSubmit={handleSearch} style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for NVIDIA, Bitcoin, AI, etc..."
              style={{
                flex: 1,
                padding: isMobile ? "12px 14px" : "14px 18px",
                fontSize: isMobile ? "15px" : "16px",
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
                padding: isMobile ? "12px 20px" : "14px 28px",
                fontSize: isMobile ? "15px" : "16px",
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
      </div>

      {loading && (
        <p style={{ textAlign: "center", padding: "40px", color: isMobile ? "#e0e0e0" : "#000" }}>
          Loading...
        </p>
      )}

      {/* CAROUSEL */}
      {!loading && featuredArticles.length > 0 && (
        <div
          style={{
            position: "relative",
            marginBottom: "40px",
            maxWidth: isMobile ? "100%" : "1600px",
            margin: "0 auto 40px auto",
            padding: isMobile ? "0 15px" : "0 20px",
          }}
        >
          <div
            style={{
              width: "100%",
              position: "relative",
              overflow: "hidden",
              background: "#1a1a1a",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
              border: isMobile ? "0px" : `3px solid ${featuredArticles[currentSlide] ? getBorderColor(featuredArticles[currentSlide].sentiment_label) : "#666"}`,
              touchAction: isMobile ? "pan-y" : "auto",
            }}
            onTouchStart={(e) => { handleTouchStart(e); setIsHovered(true); }}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => { handleTouchEnd(); setIsHovered(false); }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {featuredArticles.map((article, index) => {
              const borderColor = getBorderColor(article.sentiment_label);
              const isActive = index === currentSlide;
              const isSaved = isArticleSaved(article.id);

              return (
                <div
                  key={article.id}
                  style={{
                    position: index === 0 ? "relative" : "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    opacity: isActive ? 1 : 0,
                    transition: "opacity 0.5s ease-in-out",
                    pointerEvents: isActive ? "auto" : "none",
                    visibility: isActive ? "visible" : "hidden",
                  }}
                >
                  {isMobile ? (
                    <>
                      {/* Mobile: Image with dots */}
                      <div style={{ position: "relative", width: "100%", height: "220px", overflow: "hidden" }}>
                        <img
                          src={article.image_url}
                          alt="slide"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            bottom: "15px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            display: "flex",
                            gap: "8px",
                            zIndex: 10,
                          }}
                        >
                          {featuredArticles.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentSlide(idx)}
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                border: "none",
                                background: idx === currentSlide ? "white" : "rgba(255,255,255,0.5)",
                                cursor: "pointer",
                                padding: 0,
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Mobile: Text section */}
                      <div style={{ background: "#1a1a1a", padding: "15px", color: "white", minHeight: "150px" }}>
                        <a
                          href={article.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "white",
                            textDecoration: "none",
                            fontSize: "16px",
                            fontWeight: "700",
                            display: "block",
                            marginBottom: "8px",
                            lineHeight: "1.3",
                          }}
                        >
                          {article.title}
                        </a>

                        <p style={{ color: "#aaa", fontSize: "12px", lineHeight: "1.4", marginBottom: "10px" }}>
                          {article.summary.substring(0, 80)}...
                        </p>

                        <div style={{ marginBottom: "10px" }}>
                          <span style={{ color: "#4a9eff", fontSize: "12px", fontWeight: "600", marginRight: "10px" }}>
                            {getSourceName(article.source_url)}
                          </span>
                          <span
                            style={{
                              background: "#2d2d2d",
                              color: "#4a9eff",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: "600",
                            }}
                          >
                            {article.category}
                          </span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ color: "#888" }}>
                              {article.published_at
                                ? new Date(article.published_at).toLocaleString("en-US", {
                                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                                  })
                                : ""}
                            </span>
                            <span
                              style={{
                                background: borderColor,
                                color: "white",
                                padding: "4px 12px",
                                borderRadius: "10px",
                                fontWeight: "700",
                                fontSize: "10px",
                                textTransform: "uppercase",
                              }}
                            >
                              {article.sentiment_label}
                            </span>
                          </div>

                          {/* Save button */}
                          <button
                            onClick={() => toggleSave(article)}
                            style={{
                              background: isSaved ? "#4a9eff" : "none",
                              border: "1px solid #444",
                              borderRadius: "4px",
                              padding: "4px 8px",
                              cursor: "pointer",
                              fontSize: "12px",
                              color: isSaved ? "white" : "#aaa",
                            }}
                            title={isSaved ? "Remove from saved" : "Save for later"}
                          >
                            🔖
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Desktop: Image with overlay */}
                      <div style={{ position: "relative", width: "100%", height: "500px", overflow: "hidden" }}>
                        <img
                          src={article.image_url}
                          alt="slide"
                          style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", background: "#000" }}
                        />

                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)",
                          }}
                        />

                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "30px 40px", color: "#e0e0e0" }}>
                          {/* Sentiment + Category badges */}
                          <div style={{ marginBottom: "12px" }}>
                            <span
                              style={{
                                background: borderColor,
                                color: "white",
                                padding: "7px 18px",
                                borderRadius: "20px",
                                fontSize: "13px",
                                fontWeight: "700",
                                textTransform: "uppercase",
                                marginRight: "12px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                              }}
                            >
                              {article.sentiment_label}
                            </span>
                            <span
                              style={{
                                background: "#e3f2fd",
                                color: "#1976d2",
                                padding: "7px 18px",
                                borderRadius: "20px",
                                fontSize: "13px",
                                fontWeight: "700",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                              }}
                            >
                              {article.category}
                            </span>
                          </div>

                          <a
                            href={article.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#ffffff",
                              textDecoration: "none",
                              fontSize: "24px",
                              fontWeight: "700",
                              display: "block",
                              marginBottom: "12px",
                              lineHeight: "1.2",
                              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                            }}
                          >
                            {article.title}
                          </a>

                          <p
                            style={{
                              margin: "0 0 12px",
                              fontSize: "15px",
                              lineHeight: "1.6",
                              opacity: 0.95,
                              textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                            }}
                          >
                            {article.summary.substring(0, 150)}...
                          </p>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "14px", fontWeight: "600", opacity: 0.85, textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}>
                              {getSourceName(article.source_url)}
                            </span>

                            <button
                              onClick={() => toggleSave(article)}
                              style={{
                                background: isSaved ? "rgba(74,158,255,0.8)" : "rgba(0,0,0,0.5)",
                                border: "1px solid #555",
                                borderRadius: "4px",
                                padding: "6px 10px",
                                cursor: "pointer",
                                fontSize: "14px",
                                color: "#ccc",
                              }}
                              title={isSaved ? "Remove from saved" : "Save for later"}
                            >
                              🔖
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {/* Desktop navigation buttons */}
            {!isMobile && (
              <>
                <button
                  onClick={prevSlide}
                  style={{
                    position: "absolute",
                    left: "20px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(0,0,0,0.7)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "60px",
                    height: "60px",
                    fontSize: "30px",
                    cursor: "pointer",
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ‹
                </button>

                <button
                  onClick={nextSlide}
                  style={{
                    position: "absolute",
                    right: "20px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(0,0,0,0.7)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "60px",
                    height: "60px",
                    fontSize: "30px",
                    cursor: "pointer",
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ›
                </button>

                <div
                  style={{
                    position: "absolute",
                    bottom: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: "8px",
                    zIndex: 10,
                  }}
                >
                  {featuredArticles.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        border: "none",
                        background: index === currentSlide ? "white" : "rgba(255,255,255,0.5)",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* LIST SECTION */}
      <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
        {!loading && listArticles.length > 0 && (
          <>
            <h2 style={{ fontSize: "24px", marginBottom: "16px", fontWeight: "600" }}>
              More Articles
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {listArticles.map((item) => {
                const borderColor = getBorderColor(item.sentiment_label);
                const isSaved = isArticleSaved(item.id);

                return (
                  <div
                    key={item.id}
                    style={{
                      borderLeft: `4px solid ${borderColor}`,
                      padding: "16px",
                      background: isMobile ? "#1a1a1a" : "white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      borderRadius: "4px",
                    }}
                  >
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
                        marginBottom: "10px",
                        lineHeight: "1.4",
                      }}
                    >
                      {item.title}
                    </a>

                    <p
                      style={{
                        margin: "0 0 12px",
                        color: isMobile ? "#aaaaaa" : "#555",
                        fontSize: "14px",
                        lineHeight: "1.6",
                      }}
                    >
                      {item.summary}
                    </p>

                    <div style={{ marginBottom: "10px" }}>
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: isMobile ? "#4da3ff" : "#0066cc",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: "500",
                        }}
                      >
                        {getSourceName(item.source_url)}
                      </a>
                      {item.category && (
                        <span
                          style={{
                            marginLeft: "10px",
                            fontSize: "11px",
                            color: isMobile ? "#cccccc" : "#666",
                            background: isMobile ? "#2a2a2a" : "#f0f0f0",
                            padding: "2px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          {item.category}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ color: isMobile ? "#aaaaaa" : "#666" }}>
                          {item.published_at
                            ? new Date(item.published_at).toLocaleString("en-US", {
                                month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                              })
                            : ""}
                        </span>

                        <span
                          style={{
                            background: borderColor,
                            color: "white",
                            padding: "4px 12px",
                            borderRadius: "12px",
                            fontWeight: "600",
                            fontSize: "11px",
                            textTransform: "uppercase",
                          }}
                        >
                          {item.sentiment_label}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleSave(item)}
                        style={{
                          background: isSaved ? (isMobile ? "#4a9eff" : "#0066cc") : "none",
                          border: isMobile ? "1px solid #444" : "1px solid #ddd",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          cursor: "pointer",
                          fontSize: "12px",
                          color: isSaved ? "white" : (isMobile ? "#aaa" : "#666"),
                        }}
                        title={isSaved ? "Remove from saved" : "Save for later"}
                      >
                        🔖
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* BOTTOM PAGINATION */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "15px",
            margin: "40px 0",
            fontSize: "14px",
            color: isMobile ? "#aaaaaa" : "#666",
          }}
        >
          {currentPage > 1 && (
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); prevPageBottom(); }}
              style={{ color: isMobile ? "#4da3ff" : "#1a0dab", textDecoration: "none", cursor: "pointer" }}
            >
              &lt; Previous
            </a>
          )}

          {(() => {
            const pages = [];
            if (currentPage > 3) {
              pages.push(
                <a key={1} href="#" onClick={(e) => { e.preventDefault(); goToPageBottom(1); }}
                  style={{ color: isMobile ? "#4da3ff" : "#1a0dab", textDecoration: "none", cursor: "pointer" }}>1</a>
              );
              if (currentPage > 4) pages.push(<span key="dots1">...</span>);
            }

            const start = Math.max(1, currentPage - 2);
            const end = Math.min(totalPages, currentPage + 2);

            for (let i = start; i <= end; i++) {
              if (i === currentPage) {
                pages.push(<strong key={i} style={{ color: isMobile ? "#ffffff" : "#000" }}>{i}</strong>);
              } else {
                pages.push(
                  <a key={i} href="#" onClick={(e) => { e.preventDefault(); goToPageBottom(i); }}
                    style={{ color: isMobile ? "#4da3ff" : "#1a0dab", textDecoration: "none", cursor: "pointer" }}>{i}</a>
                );
              }
            }

            if (currentPage < totalPages - 2) {
              if (currentPage < totalPages - 3) pages.push(<span key="dots2">...</span>);
              pages.push(
                <a key={totalPages} href="#" onClick={(e) => { e.preventDefault(); goToPageBottom(totalPages); }}
                  style={{ color: isMobile ? "#4da3ff" : "#1a0dab", textDecoration: "none", cursor: "pointer" }}>{totalPages}</a>
              );
            }
            return pages;
          })()}

          {currentPage < totalPages && (
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); nextPageBottom(); }}
              style={{ color: isMobile ? "#4da3ff" : "#1a0dab", textDecoration: "none", cursor: "pointer" }}
            >
              Next &gt;
            </a>
          )}
        </div>
      </div>
    </div>
  );
}