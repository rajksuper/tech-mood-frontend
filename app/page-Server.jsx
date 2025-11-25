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
    fetch("https://tech-mood-backend-production.up.railway.app/categories")
      .then((res) => res.json())
      .then((json) => setCategories(json.categories || []))
      .catch(() => {});
    
    // Calculate total number of pages
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

      {/* FULL-WIDTH CAROUSEL */}
      {!loading && featuredArticles.length > 0 && (
        <div style={{ position: "relative", marginBottom: "40px" }}>
          {/* Carousel Container */}
          <div 
            style={{ 
              width: "100vw", 
              height: isMobile ? "350px" : "500px", 
              position: "relative",
              overflow: "hidden",
              background: "#000"
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: isActive ? 1 : 0,
                    transition: "opacity 0.5s ease-in-out",
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                >
                  {/* Background Image */}
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
                  
                  {/* Dark overlay */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.4)",
                  }} />
                  
                  {/* Content Overlay */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: isMobile ? "20px" : "40px",
                      background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
                      color: "white",
                    }}
                  >
                    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                      <span
                        style={{
                          background: borderColor,
                          color: "white",
                          padding: isMobile ? "4px 12px" : "6px 16px",
                          borderRadius: "20px",
                          fontSize: isMobile ? "10px" : "12px",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          marginRight: "12px",
                        }}
                      >
                        {article.sentiment_label}
                      </span>
                      
                      <span
                        style={{
                          background: "#e3f2fd",
                          color: "#1976d2",
                          padding: isMobile ? "4px 12px" : "6px 16px",
                          borderRadius: "20px",
                          fontSize: isMobile ? "10px" : "12px",
                          fontWeight: "700",
                        }}
                      >
                        {article.category}
                      </span>

                      <a
                        href={article.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "white",
                          textDecoration: "none",
                          fontSize: isMobile ? "20px" : "36px",
                          fontWeight: "700",
                          display: "block",
                          margin: "16px 0",
                          lineHeight: "1.2",
                        }}
                      >
                        {article.title}
                      </a>

                      <p
                        style={{
                          fontSize: isMobile ? "14px" : "18px",
                          lineHeight: "1.6",
                          marginBottom: "16px",
                          opacity: 0.9,
                        }}
                      >
                        {article.summary.substring(0, 150)}...
                      </p>

                      <span style={{ fontSize: isMobile ? "12px" : "14px", fontWeight: "600", opacity: 0.8 }}>
                        {getSourceName(article.source_url)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* LEFT ARROW */}
          <button
            onClick={prevSlide}
            style={{
              position: "absolute",
              left: isMobile ? "10px" : "20px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.7)",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: isMobile ? "40px" : "60px",
              height: isMobile ? "40px" : "60px",
              fontSize: isMobile ? "20px" : "30px",
              cursor: "pointer",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ‹
          </button>

          {/* RIGHT ARROW */}
          <button
            onClick={nextSlide}
            style={{
              position: "absolute",
              right: isMobile ? "10px" : "20px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.7)",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: isMobile ? "40px" : "60px",
              height: isMobile ? "40px" : "60px",
              fontSize: isMobile ? "20px" : "30px",
              cursor: "pointer",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ›
          </button>

          {/* DOTS INDICATOR */}
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
                  width: "12px",
                  height: "12px",
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
                      borderLeft: `6px solid ${borderColor}`,
                      borderRadius: "8px",
                      padding: "16px 20px",
                      background: "white",
                      display: "flex",
                      gap: "20px",
                      alignItems: "center",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "6px",
                        background: `linear-gradient(135deg, ${borderColor}20, ${borderColor}40)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: borderColor,
                        flexShrink: 0,
                      }}
                    >
                      {item.category ? item.category[0].toUpperCase() : "T"}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
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
                          marginBottom: "8px",
                          lineHeight: "1.4",
                        }}
                      >
                        {item.title}
                      </a>

                      <p
                        style={{
                          margin: "0 0 10px",
                          color: "#555",
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

                      <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "#666" }}>
                        <span style={{ color: "#0066cc", fontWeight: "500" }}>
                          {getSourceName(item.source_url)}
                        </span>
                        <span style={{ color: "#ccc" }}>•</span>
                        <span>
                          {item.published_at ? new Date(item.published_at).toLocaleTimeString() : ""}
                        </span>
                      </div>
                    </div>

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
                      }}
                    >
                      {item.sentiment_label}
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