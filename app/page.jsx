"use client";
import { useState, useEffect, useRef } from "react";

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
  const [categories, setCategories] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [listArticles, setListArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); // Will be calculated dynamically
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const scrollPositionRef = useRef(0);
  const isTopPaginationRef = useRef(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/categories")
      .then((res) => res.json())
      .then((json) => setCategories(json.categories || []))
      .catch(() => {});
    
    // Calculate total number of pages
    calculateTotalPages();
  }, []);

  const calculateTotalPages = () => {
    const countUrl = selectedCategory
      ? `http://127.0.0.1:8000/articles/count?category=${encodeURIComponent(selectedCategory)}`
      : "http://127.0.0.1:8000/articles/count";
    
    fetch(countUrl)
      .then((res) => res.json())
      .then((json) => {
        const total = json.count || 0;
        const pages = Math.ceil(total / 24); // 24 articles per page
        setTotalPages(pages);
      })
      .catch(() => setTotalPages(1));
  };

  useEffect(() => {
    loadArticles();
    calculateTotalPages(); // Recalculate when category changes
  }, [selectedCategory, currentPage]);

  // Restore scroll position after loading (for top pagination only)
  useEffect(() => {
    if (!loading && isTopPaginationRef.current) {
      window.scrollTo(0, scrollPositionRef.current);
      isTopPaginationRef.current = false;
    }
  }, [loading]);

  // Auto-play carousel every 5 seconds (pause on hover)
  useEffect(() => {
    if (isHovered) return; // Don't auto-play when mouse is over carousel
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredArticles.length);
    }, 5000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [featuredArticles.length, isHovered]);

  // Keyboard navigation (arrow keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [featuredArticles.length]);

  const loadArticles = () => {
    setLoading(true);
    setCurrentSlide(0);
    
    // Page 1 uses /articles, Page 2+ uses /articles/page/N
    const pageNum = currentPage - 1; // API uses 0-indexed pages
    let url;
    
    if (currentPage === 1) {
      url = selectedCategory
        ? `http://127.0.0.1:8000/articles?category=${encodeURIComponent(selectedCategory)}`
        : "http://127.0.0.1:8000/articles";
    } else {
      url = selectedCategory
        ? `http://127.0.0.1:8000/articles/page/${pageNum}?category=${encodeURIComponent(selectedCategory)}`
        : `http://127.0.0.1:8000/articles/page/${pageNum}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        const allArticles = Array.isArray(json.articles) ? json.articles : [];
        
        // SHUFFLE articles randomly on each page load
        const shuffled = allArticles.sort(() => Math.random() - 0.5);
        
        // 12 with images for carousel, rest without for list
        const withImages = shuffled.filter(a => a.image_url).slice(0, 12);
        const withoutImages = shuffled.filter(a => !a.image_url).slice(0, 12);
        
        setFeaturedArticles(withImages);
        setListArticles(withoutImages);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const goToPage = (pageNum) => {
    setCurrentPage(pageNum);
  };

  const goToPageTop = (pageNum) => {
    scrollPositionRef.current = window.scrollY;
    isTopPaginationRef.current = true;
    setCurrentPage(pageNum);
  };

  const goToPageBottom = (pageNum) => {
    isTopPaginationRef.current = false;
    setCurrentPage(pageNum);
    // Scroll to top smoothly
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const prevPageBottom = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setCurrentSlide((prev) => (prev + 1) % featuredArticles.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredArticles.length) % featuredArticles.length);
  };

  // Touch swipe support
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swipe left
      nextSlide();
    }

    if (touchStart - touchEnd < -75) {
      // Swipe right
      prevSlide();
    }
  };

  return (
    <div
      style={{
        fontFamily: "Courier New, monospace",
      }}
    >
      {/* HEADER */}
      <div style={{ padding: "20px", maxWidth: "1600px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Tech Mood Dashboard</h1>
        <h3 style={{ color: "#666", fontWeight: "normal", marginBottom: "20px" }}>
          Real-time sentiment analysis of technology news
        </h3>

        {/* CATEGORY PILLS */}
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            whiteSpace: "nowrap",
            paddingBottom: "10px",
          }}
        >
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontFamily: "Courier New, monospace",
              background: selectedCategory === null ? "#0066cc" : "white",
              color: selectedCategory === null ? "white" : "#333",
              border: "2px solid #0066cc",
              borderRadius: "20px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            All
          </button>
          {categories.filter(cat => cat !== "General Tech").map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontFamily: "Courier New, monospace",
                background: selectedCategory === cat ? "#0066cc" : "white",
                color: selectedCategory === cat ? "white" : "#333",
                border: "2px solid #0066cc",
                borderRadius: "20px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* GOOGLE-STYLE PAGINATION (Top) */}
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center",
          gap: "15px",
          marginBottom: "20px",
          fontSize: "14px",
          color: "#666"
        }}>
          {currentPage > 1 && (
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); prevPageTop(); }}
              style={{
                color: "#1a0dab",
                textDecoration: "none",
                cursor: "pointer"
              }}
            >
              &lt; Previous
            </a>
          )}

          {/* Smart pagination logic */}
          {(() => {
            const pages = [];
            const showPages = 5; // Show 5 page numbers at a time
            
            // Always show first page
            if (currentPage > 3) {
              pages.push(
                <a
                  key={1}
                  href="#"
                  onClick={(e) => { e.preventDefault(); goToPageTop(1); }}
                  style={{ color: "#1a0dab", textDecoration: "none", cursor: "pointer" }}
                >
                  1
                </a>
              );
              if (currentPage > 4) {
                pages.push(<span key="dots1">...</span>);
              }
            }
            
            // Show pages around current page
            const start = Math.max(1, currentPage - 2);
            const end = Math.min(totalPages, currentPage + 2);
            
            for (let i = start; i <= end; i++) {
              if (i === currentPage) {
                pages.push(<strong key={i} style={{ color: "#000" }}>{i}</strong>);
              } else {
                pages.push(
                  <a
                    key={i}
                    href="#"
                    onClick={(e) => { e.preventDefault(); goToPageTop(i); }}
                    style={{ color: "#1a0dab", textDecoration: "none", cursor: "pointer" }}
                  >
                    {i}
                  </a>
                );
              }
            }
            
            // Always show last page
            if (currentPage < totalPages - 2) {
              if (currentPage < totalPages - 3) {
                pages.push(<span key="dots2">...</span>);
              }
              pages.push(
                <a
                  key={totalPages}
                  href="#"
                  onClick={(e) => { e.preventDefault(); goToPageTop(totalPages); }}
                  style={{ color: "#1a0dab", textDecoration: "none", cursor: "pointer" }}
                >
                  {totalPages}
                </a>
              );
            }
            
            return pages;
          })()}

          {currentPage < totalPages && (
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); nextPageTop(); }}
              style={{
                color: "#1a0dab",
                textDecoration: "none",
                cursor: "pointer"
              }}
            >
              Next &gt;
            </a>
          )}
        </div>
      </div>

      {loading && <p style={{ textAlign: "center", padding: "40px" }}>Loading...</p>}


      {/* CAROUSEL - Desktop: Text Overlay, Mobile: Clean Image + Dark Section */}
      {!loading && featuredArticles.length > 0 && (
        <div style={{ 
          position: "relative", 
          marginBottom: "40px",
          maxWidth: isMobile ? "100%" : "1600px",
          margin: "0 auto 40px auto",
          padding: isMobile ? "0 10px" : "0 20px"
        }}>
          <div 
            style={{ 
              width: "100%", 
              position: "relative",
              overflow: "hidden",
              background: "#1a1a1a",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
              border: `3px solid ${featuredArticles[currentSlide] ? getBorderColor(featuredArticles[currentSlide].sentiment_label) : "#666"}`,
            }}
            onTouchStart={(e) => {
              handleTouchStart(e);
              setIsHovered(true);
            }}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => {
              handleTouchEnd();
              setIsHovered(false);
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {featuredArticles.map((article, index) => {
              const borderColor = getBorderColor(article.sentiment_label);
              const isActive = index === currentSlide;
              
              return (
                <div
                  key={article.id}
                  style={{
                    position: isActive ? "relative" : "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    opacity: isActive ? 1 : 0,
                    transition: "opacity 0.5s ease-in-out",
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                >
                  {isMobile ? (
                    <>
                      <div style={{ 
                        position: "relative",
                        width: "100%",
                        height: "300px",
                        overflow: "hidden"
                      }}>
                        <img
                          src={article.image_url}
                          alt="slide"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>

                      <div style={{
                        background: "#1a1a1a",
                        padding: "20px",
                        color: "white"
                      }}>
                        <a
                          href={article.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "white",
                            textDecoration: "none",
                            fontSize: "20px",
                            fontWeight: "700",
                            display: "block",
                            marginBottom: "12px",
                            lineHeight: "1.3",
                            fontFamily: "Courier New, monospace",
                          }}
                        >
                          {article.title}
                        </a>

                        <p style={{
                          color: "#aaa",
                          fontSize: "14px",
                          lineHeight: "1.6",
                          marginBottom: "14px",
                          fontFamily: "Courier New, monospace",
                        }}>
                          {article.summary.substring(0, 120)}...
                        </p>

                        <div style={{ marginBottom: "12px" }}>
                          <span style={{
                            color: "#4a9eff",
                            fontSize: "13px",
                            fontWeight: "600",
                            marginRight: "10px"
                          }}>
                            {getSourceName(article.source_url)}
                          </span>
                          <span style={{
                            background: "#2d2d2d",
                            color: "#4a9eff",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "600"
                          }}>
                            {article.category}
                          </span>
                        </div>

                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "12px"
                        }}>
                          <span style={{ color: "#888" }}>
                            {article.published_at
                              ? new Date(article.published_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : ""}
                          </span>

                          <span style={{
                            background: borderColor,
                            color: "white",
                            padding: "5px 14px",
                            borderRadius: "12px",
                            fontWeight: "700",
                            fontSize: "11px",
                            textTransform: "uppercase"
                          }}>
                            {article.sentiment_label}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ 
                        position: "relative",
                        width: "100%",
                        height: "500px"
                      }}>
                        <img
                          src={article.image_url}
                          alt="slide"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            objectPosition: "center",
                            background: "#000",
                          }}
                        />
                        
                        <div style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: "rgba(0,0,0,0.4)",
                        }} />

                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: "48px",
                            background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)",
                            color: "white",
                          }}
                        >
                          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
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
                                color: "white",
                                textDecoration: "none",
                                fontSize: "38px",
                                fontWeight: "700",
                                display: "block",
                                margin: "12px 0",
                                lineHeight: "1.2",
                                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                              }}
                            >
                              {article.title}
                            </a>

                            <p
                              style={{
                                fontSize: "18px",
                                lineHeight: "1.6",
                                marginBottom: "12px",
                                opacity: 0.95,
                                textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                              }}
                            >
                              {article.summary.substring(0, 150)}...
                            </p>

                            <span style={{ 
                              fontSize: "14px", 
                              fontWeight: "600", 
                              opacity: 0.85,
                              textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                            }}>
                              {getSourceName(article.source_url)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

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
              </>
            )}

            <div
              style={{
                position: "absolute",
                bottom: isMobile ? "100px" : "20px",
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

                return (
                  <div
                    key={item.id}
                    style={{
                      borderLeft: `4px solid ${borderColor}`,
                      padding: "16px",
                      background: "white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      borderRadius: "4px",
                    }}
                  >
                    {/* Row 1: Title */}
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#1a0dab",
                        textDecoration: "none",
                        fontSize: "18px",
                        fontWeight: "600",
                        display: "block",
                        marginBottom: "10px",
                        lineHeight: "1.4",
                        fontFamily: "Courier New, monospace",
                      }}
                    >
                      {item.title}
                    </a>

                    {/* Row 2: Summary */}
                    <p
                      style={{
                        margin: "0 0 12px",
                        color: "#555",
                        fontSize: "14px",
                        lineHeight: "1.6",
                        fontFamily: "Courier New, monospace",
                      }}
                    >
                      {item.summary}
                    </p>

                    {/* Row 3: Source + Category */}
                    <div style={{ marginBottom: "10px" }}>
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#0066cc",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: "500",
                        }}
                      >
                        {getSourceName(item.source_url)}
                      </a>
                      {item.category && (
                        <span style={{
                          marginLeft: "10px",
                          fontSize: "11px",
                          color: "#666",
                          background: "#f0f0f0",
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}>
                          {item.category}
                        </span>
                      )}
                    </div>

                    {/* Row 4: Timestamp (LEFT) and Sentiment (RIGHT) */}
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      fontSize: "12px",
                    }}>
                      {/* LEFT: Timestamp */}
                      <span style={{ color: "#666" }}>
                        {item.published_at
                          ? new Date(item.published_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : ""}
                      </span>

                      {/* RIGHT: Sentiment Badge */}
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
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* PAGE NAVIGATION (Bottom - Text Links with Scroll to Top) */}
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center",
          gap: "20px",
          margin: "40px 0",
          fontSize: "18px",
          color: "#666",
          fontFamily: "Courier New, monospace"
        }}>
          {currentPage > 1 && (
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); prevPageBottom(); }}
              style={{
                color: "#1a0dab",
                textDecoration: "none",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              &lt; Previous
            </a>
          )}

          {/* Smart pagination logic */}
          {(() => {
            const pages = [];
            
            // Always show first page
            if (currentPage > 3) {
              pages.push(
                <a
                  key={1}
                  href="#"
                  onClick={(e) => { e.preventDefault(); goToPageBottom(1); }}
                  style={{ color: "#1a0dab", textDecoration: "none", cursor: "pointer" }}
                >
                  1
                </a>
              );
              if (currentPage > 4) {
                pages.push(<span key="dots1">...</span>);
              }
            }
            
            // Show pages around current page
            const start = Math.max(1, currentPage - 2);
            const end = Math.min(totalPages, currentPage + 2);
            
            for (let i = start; i <= end; i++) {
              if (i === currentPage) {
                pages.push(<strong key={i} style={{ color: "#000", fontSize: "19px" }}>{i}</strong>);
              } else {
                pages.push(
                  <a
                    key={i}
                    href="#"
                    onClick={(e) => { e.preventDefault(); goToPageBottom(i); }}
                    style={{ color: "#1a0dab", textDecoration: "none", cursor: "pointer" }}
                  >
                    {i}
                  </a>
                );
              }
            }
            
            // Always show last page
            if (currentPage < totalPages - 2) {
              if (currentPage < totalPages - 3) {
                pages.push(<span key="dots2">...</span>);
              }
              pages.push(
                <a
                  key={totalPages}
                  href="#"
                  onClick={(e) => { e.preventDefault(); goToPageBottom(totalPages); }}
                  style={{ color: "#1a0dab", textDecoration: "none", cursor: "pointer" }}
                >
                  {totalPages}
                </a>
              );
            }
            
            return pages;
          })()}

          {currentPage < totalPages && (
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); nextPageBottom(); }}
              style={{
                color: "#1a0dab",
                textDecoration: "none",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              Next &gt;
            </a>
          )}
        </div>
      </div>
    </div>
  );
}