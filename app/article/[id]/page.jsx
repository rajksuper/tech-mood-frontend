"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

// Share functions
function shareOnTwitter(article) {
  const url = encodeURIComponent(`https://techsentiments.com/article/${article.id}`);
  const text = encodeURIComponent(`${article.title}`);
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
}

function shareOnLinkedIn(article) {
  const url = encodeURIComponent(`https://techsentiments.com/article/${article.id}`);
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
}

function copyLink(article, setCopiedId) {
  const url = `https://techsentiments.com/article/${article.id}`;
  navigator.clipboard.writeText(url);
  setCopiedId(article.id);
  setTimeout(() => setCopiedId(null), 2000);
}

export default function ArticlePage() {
  const router = useRouter();
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarks, setBookmarks] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load bookmarks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("bookmarks");
    if (saved) setBookmarks(JSON.parse(saved));
  }, []);

  // Toggle bookmark
  const toggleBookmark = (articleToBookmark) => {
    const isBookmarked = bookmarks.some((b) => b.id === articleToBookmark.id);
    let newBookmarks;
    if (isBookmarked) {
      newBookmarks = bookmarks.filter((b) => b.id !== articleToBookmark.id);
    } else {
      newBookmarks = [...bookmarks, articleToBookmark];
    }
    setBookmarks(newBookmarks);
    localStorage.setItem("bookmarks", JSON.stringify(newBookmarks));
  };

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
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Sentiment badge color
  const getSentimentColor = (label) => {
    if (label === 'positive') return '#22c55e';
    if (label === 'negative') return '#ef4444';
    return '#64748b';
  };

  // Sentiment badge background
  const getSentimentBg = (label) => {
    if (label === 'positive') return '#dcfce7';
    if (label === 'negative') return '#fee2e2';
    return '#fef3c7';
  };

  // Sentiment badge text color
  const getSentimentText = (label) => {
    if (label === 'positive') return '#166534';
    if (label === 'negative') return '#991b1b';
    return '#92400e';
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: isMobile ? '#0d0d0d' : '#ffffff',
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
        background: isMobile ? '#0d0d0d' : '#ffffff',
        color: isMobile ? '#ffffff' : '#1a1a1a',
        padding: '20px'
      }}>
        <p style={{ fontSize: '18px', marginBottom: '20px' }}>Article not found</p>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: isMobile ? '#0d0d0d' : '#ffffff',
      minHeight: '100vh',
      paddingBottom: '40px'
    }}>
      {/* Header with logo and search bar */}
      <div style={{
        padding: isMobile ? '15px' : '20px 40px',
        borderBottom: isMobile ? '1px solid #333' : '1px solid #e0e0e0',
        background: isMobile ? '#1a1a1a' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Logo - clicks to home */}
        <div
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '24px' }}>🤖</span>
          <span style={{
            fontSize: isMobile ? '18px' : '22px',
            fontWeight: '700',
            color: isMobile ? '#ffffff' : '#1a1a1a'
          }}>
            Tech Sentiments
          </span>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{
          display: 'flex',
          flex: '1',
          maxWidth: '500px',
          minWidth: '200px'
        }}>
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: '1',
              padding: '10px 15px',
              border: isMobile ? '1px solid #444' : '1px solid #ddd',
              borderRadius: '25px 0 0 25px',
              fontSize: '14px',
              outline: 'none',
              background: isMobile ? '#2a2a2a' : '#f5f5f5',
              color: isMobile ? '#fff' : '#333'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '0 25px 25px 0',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔍
          </button>
        </form>

        {/* Bookmarks count */}
        <div
          onClick={() => router.push('/?bookmarks=true')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            color: isMobile ? '#f59e0b' : '#f59e0b'
          }}
        >
          <span style={{ fontSize: '20px' }}>🔖</span>
          <span style={{ fontWeight: '600' }}>{bookmarks.length}</span>
        </div>
      </div>

      {/* Main Article */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: isMobile ? '20px 15px' : '40px 20px'
      }}>
        {/* Category badge */}
        <div style={{ marginBottom: '15px' }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: isMobile ? '#2a2a2a' : '#f0f0f0',
            color: isMobile ? '#4da3ff' : '#3b82f6',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {article.category}
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: isMobile ? '24px' : '32px',
          fontWeight: '700',
          lineHeight: '1.3',
          marginBottom: '20px',
          color: isMobile ? '#ffffff' : '#1a1a1a'
        }}>
          {article.title}
        </h1>

        {/* Meta info */}
        <div style={{
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          marginBottom: '25px',
          fontSize: '14px',
          color: isMobile ? '#888' : '#666',
          flexWrap: 'wrap'
        }}>
          <span>
            <strong style={{ color: isMobile ? '#aaa' : '#333' }}>Source:</strong> {getSourceName(article.source_url)}
          </span>
          {article.published_at && (
            <span>• {getTimeAgo(article.published_at)}</span>
          )}
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
              borderRadius: '12px',
              marginBottom: '30px'
            }}
          />
        )}

        {/* Full Summary */}
        {article.summary && (
          <div style={{
            fontSize: '16px',
            lineHeight: '1.8',
            marginBottom: '30px',
            color: isMobile ? '#e0e0e0' : '#333',
            background: isMobile ? '#1a1a1a' : '#f9f9f9',
            padding: '20px',
            borderRadius: '12px',
            borderLeft: '4px solid #3b82f6'
          }}>
            <p style={{ margin: 0 }}>{article.summary}</p>
          </div>
        )}

        {/* Sentiment Analysis */}
        <div style={{
          background: isMobile ? '#1a1a1a' : '#f9f9f9',
          border: `2px solid ${getSentimentColor(article.sentiment_label)}`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '24px' }}>
              {article.sentiment_label === 'positive' ? '📈' : article.sentiment_label === 'negative' ? '📉' : '➡️'}
            </span>
            <div>
              <div style={{
                fontSize: '12px',
                color: isMobile ? '#888' : '#666',
                marginBottom: '2px'
              }}>
                AI Sentiment Analysis
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: getSentimentColor(article.sentiment_label),
                textTransform: 'capitalize'
              }}>
                {article.sentiment_label}
              </div>
            </div>
          </div>
          {article.sentiment_score && (
            <div style={{
              fontSize: '13px',
              color: isMobile ? '#aaa' : '#666'
            }}>
              Confidence: {(article.sentiment_score * 100).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Read Full Article Button */}
        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '15px 30px',
            background: '#3b82f6',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '16px',
            transition: 'background 0.2s',
            marginBottom: '60px'
          }}
          onMouseOver={(e) => e.target.style.background = '#2563eb'}
          onMouseOut={(e) => e.target.style.background = '#3b82f6'}
        >
          Read Full Article on {getSourceName(article.source_url)} →
        </a>

        {/* Divider */}
        <div style={{
          borderTop: isMobile ? '2px solid #333' : '2px solid #e0e0e0',
          marginBottom: '40px'
        }}></div>

        {/* Related Articles Section */}
        <div>
          <h2 style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '600',
            marginBottom: '25px',
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
                gap: '20px',
                marginBottom: '40px'
              }}>
                {relatedArticles.map((related) => {
                  const isBookmarked = bookmarks.some((b) => b.id === related.id);
                  
                  return (
                    <div
                      key={related.id}
                      style={{
                        background: isMobile ? '#1a1a1a' : '#fffbeb',
                        border: isMobile ? '1px solid #333' : '1px solid #fde68a',
                        borderRadius: '12px',
                        padding: '15px',
                        display: 'flex',
                        gap: '15px',
                        alignItems: 'flex-start',
                        transition: 'box-shadow 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Image */}
                      {related.image_url ? (
                        <a href={`/article/${related.id}`} style={{ flexShrink: 0 }}>
                          <img
                            src={related.image_url}
                            alt={related.title}
                            style={{
                              width: isMobile ? '80px' : '120px',
                              height: isMobile ? '80px' : '90px',
                              objectFit: 'cover',
                              borderRadius: '8px'
                            }}
                          />
                        </a>
                      ) : (
                        <a
                          href={`/article/${related.id}`}
                          style={{
                            width: isMobile ? '80px' : '120px',
                            height: isMobile ? '80px' : '90px',
                            background: '#fde68a',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            textDecoration: 'none'
                          }}
                        >
                          <span style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#d97706'
                          }}>
                            {getSourceName(related.source_url).charAt(0).toUpperCase()}
                          </span>
                        </a>
                      )}

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Title */}
                        <a
                          href={`/article/${related.id}`}
                          style={{
                            fontSize: isMobile ? '15px' : '17px',
                            fontWeight: '600',
                            lineHeight: '1.4',
                            color: '#1a0dab',
                            textDecoration: 'none',
                            display: 'block',
                            marginBottom: '8px'
                          }}
                        >
                          {related.title}
                        </a>

                        {/* Summary */}
                        {related.summary && (
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.5',
                            color: isMobile ? '#aaa' : '#555',
                            marginBottom: '10px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            margin: '0 0 10px 0'
                          }}>
                            {related.summary}
                          </p>
                        )}

                        {/* Meta row: source, time, sentiment badge, category */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          flexWrap: 'wrap',
                          fontSize: '12px',
                          marginBottom: '10px'
                        }}>
                          <span style={{ color: isMobile ? '#888' : '#666' }}>
                            {getSourceName(related.source_url)}
                          </span>
                          {related.published_at && (
                            <>
                              <span style={{ color: isMobile ? '#666' : '#999' }}>•</span>
                              <span style={{ color: isMobile ? '#888' : '#666' }}>
                                {getTimeAgo(related.published_at)}
                              </span>
                            </>
                          )}
                          {related.sentiment_label && (
                            <>
                              <span style={{ color: isMobile ? '#666' : '#999' }}>•</span>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                background: getSentimentBg(related.sentiment_label),
                                color: getSentimentText(related.sentiment_label)
                              }}>
                                {related.sentiment_label}
                              </span>
                            </>
                          )}
                          {related.category && (
                            <>
                              <span style={{ color: isMobile ? '#666' : '#999' }}>•</span>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                background: isMobile ? '#2a2a2a' : '#e5e7eb',
                                color: isMobile ? '#aaa' : '#4b5563'
                              }}>
                                {related.category}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Share icons and bookmark */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          {/* Twitter/X */}
                          <button
                            onClick={() => shareOnTwitter(related)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              fontSize: '16px',
                              color: isMobile ? '#888' : '#666'
                            }}
                            title="Share on X"
                          >
                            𝕏
                          </button>

                          {/* LinkedIn */}
                          <button
                            onClick={() => shareOnLinkedIn(related)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              fontSize: '14px',
                              color: isMobile ? '#888' : '#0077b5'
                            }}
                            title="Share on LinkedIn"
                          >
                            in
                          </button>

                          {/* Copy link */}
                          <button
                            onClick={() => copyLink(related, setCopiedId)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              fontSize: '14px',
                              color: copiedId === related.id ? '#22c55e' : (isMobile ? '#888' : '#666')
                            }}
                            title="Copy link"
                          >
                            {copiedId === related.id ? '✓' : '📋'}
                          </button>

                          {/* Bookmark */}
                          <button
                            onClick={() => toggleBookmark(related)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              fontSize: '16px',
                              color: isBookmarked ? '#f59e0b' : (isMobile ? '#888' : '#666')
                            }}
                            title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                          >
                            {isBookmarked ? '🔖' : '🏷️'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: isMobile ? '8px' : '12px',
                  fontSize: '14px',
                  color: isMobile ? '#aaa' : '#666'
                }}>
                  {currentPage > 1 && (
                    <button
                      onClick={prevPage}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isMobile ? '#4da3ff' : '#1a0dab',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Previous
                    </button>
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
                        <button
                          key={i}
                          onClick={() => goToPage(i)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: i === currentPage ? (isMobile ? '#fff' : '#333') : (isMobile ? '#4da3ff' : '#1a0dab'),
                            fontWeight: i === currentPage ? '700' : 'normal',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          {i}
                        </button>
                      );
                    }
                    
                    if (endPage < totalPages) {
                      pages.push(<span key="dots">...</span>);
                    }

                    return pages;
                  })()}

                  {currentPage < totalPages && (
                    <button
                      onClick={nextPage}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isMobile ? '#4da3ff' : '#1a0dab',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Next
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}