import { useState, useEffect } from "react";
import { productService, cartService, reviewService, authService } from "../services/api";
import "./Product.css";

function Product() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filter & Search states
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  
  // Product Detail Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);

  // New review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const currentUser = authService.getCurrentUser();

  // Load categories once
  useEffect(() => {
    fetchCategories();
  }, []);

  // Reload products whenever filters, paging or sorting change
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, brand, minPrice, maxPrice, minRating, sortBy, page]);

  const fetchCategories = async () => {
    try {
      const res = await productService.getCategories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        category: category || undefined,
        brand: brand || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        minRating: minRating ? parseInt(minRating) : undefined,
        sortBy: sortBy,
        page: page,
        pageSize: pageSize,
      };
      
      const res = await productService.getProducts(params);
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategory("");
    setBrand("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setSortBy("latest");
    setPage(1);
  };

  const handleOpenDetail = async (product) => {
    setSelectedProduct(product);
    setSelectedColor("");
    setSelectedSize("");
    setSelectedVariant(null);
    setQuantity(1);
    setReviewText("");
    setReviewRating(5);
    
    // Load reviews
    try {
      const res = await reviewService.getProductReviews(product.id);
      if (res.success) {
        setReviews(res.data);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setReviews([]);
    }
  };

  // Find variant based on color and size
  useEffect(() => {
    if (!selectedProduct || !selectedProduct.variants) return;
    
    const variant = selectedProduct.variants.find(v => {
      const colorMatch = !v.color || v.color.toLowerCase() === selectedColor.toLowerCase();
      const sizeMatch = !v.size || v.size.toLowerCase() === selectedSize.toLowerCase();
      return colorMatch && sizeMatch;
    });

    setSelectedVariant(variant || null);
  }, [selectedColor, selectedSize, selectedProduct]);

  const handleAddCart = async (product) => {
    if (!currentUser) {
      alert("⚠️ Please log in to add items to your cart.");
      return;
    }

    let variantId = null;
    if (product.variants && product.variants.length > 0) {
      if (selectedProduct && selectedProduct.id === product.id) {
        if (!selectedVariant) {
          alert("⚠️ Please select a valid size and color combination.");
          return;
        }
        variantId = selectedVariant.id;
      } else {
        // Just take the first variant if clicking add directly from grid
        variantId = product.variants[0].id;
      }
    }

    try {
      const res = await cartService.addToCart(product.id, quantity, variantId);
      if (res.success) {
        alert("🛒 Added to Cart successfully!");
        if (selectedProduct) setSelectedProduct(null); // Close modal
      } else {
        alert(`❌ Error: ${res.message}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add to cart.");
    }
  };

  const handleAddWishlist = async (product) => {
    if (!currentUser) {
      alert("⚠️ Please log in to add items to your wishlist.");
      return;
    }
    try {
      const res = await cartService.addToWishlist(product.id);
      if (res.success) {
        alert("❤️ Added to Wishlist successfully!");
      } else {
        alert(`❌ Error: ${res.message}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add to wishlist.");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("⚠️ Log in to submit reviews.");
      return;
    }
    try {
      const res = await reviewService.createReview({
        productId: selectedProduct.id,
        rating: reviewRating,
        reviewText: reviewText,
        imageUrls: [],
      });
      if (res.success) {
        alert("⭐ Review submitted successfully!");
        // Refresh reviews
        const reviewRes = await reviewService.getProductReviews(selectedProduct.id);
        if (reviewRes.success) setReviews(reviewRes.data);
        setReviewText("");
        setReviewRating(5);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit review.");
    }
  };

  // Extract unique colors and sizes from variants
  const getColorsAndSizes = (variants) => {
    const colors = new Set();
    const sizes = new Set();
    variants.forEach(v => {
      if (v.color) colors.add(v.color);
      if (v.size) sizes.add(v.size);
    });
    return { colors: Array.from(colors), sizes: Array.from(sizes) };
  };

  return (
    <div className="product-page-container">
      {/* Search and Filters Header */}
      <div className="catalog-header">
        <h1 className="catalog-title">Explore Catalog</h1>
        <div className="search-bar-wrapper">
          <input
            type="text"
            className="catalog-search"
            placeholder="🔍 Search products, categories, or brands..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="catalog-layout">
        {/* Sidebar Filters */}
        <aside className="filters-sidebar card">
          <div className="sidebar-header">
            <h3>Filters</h3>
            <button className="reset-filters-btn" onClick={handleResetFilters}>
              Reset All
            </button>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Brand</label>
            <input
              type="text"
              placeholder="e.g. Nike, Apple"
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="filter-group">
            <label>Price Range</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Minimum Rating</label>
            <select
              value={minRating}
              onChange={(e) => {
                setMinRating(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Any Rating</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
              <option value="4">⭐⭐⭐⭐☆ (4+ Stars)</option>
              <option value="3">⭐⭐⭐☆☆ (3+ Stars)</option>
              <option value="2">⭐⭐☆☆☆ (2+ Stars)</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="latest">Latest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="popularity">Most Reviews</option>
              <option value="best_selling">Best Selling</option>
            </select>
          </div>
        </aside>

        {/* Products Catalog Grid */}
        <main className="catalog-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Fetching products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state card">
              <h2>No Products Found</h2>
              <p>Try clearing filters or adjusting search parameters.</p>
              <button className="btn btn-primary" onClick={handleResetFilters}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map((product) => (
                  <div key={product.id} className="product-card card" onClick={() => handleOpenDetail(product)}>
                    <div className="card-image-container">
                      <img
                        src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"}
                        alt={product.title}
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";
                        }}
                      />
                      {product.discount > 0 && (
                        <span className="card-badge discount-badge">
                          Save ₹{product.discount}
                        </span>
                      )}
                    </div>
                    
                    <div className="card-details">
                      <span className="card-category">{product.category}</span>
                      <h3 className="card-title">{product.title}</h3>
                      <div className="card-rating">
                        {"⭐".repeat(Math.round(product.averageRating || 0)) || "No ratings"}
                        {product.averageRating > 0 && <span className="rating-num">({product.averageRating})</span>}
                      </div>
                      <div className="card-bottom">
                        <span className="card-price">₹{product.price}</span>
                        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="card-action-btn wish-btn"
                            title="Add to Wishlist"
                            onClick={() => handleAddWishlist(product)}
                          >
                            ❤️
                          </button>
                          <button
                            className="card-action-btn cart-btn"
                            title="Add to Cart"
                            onClick={() => handleAddCart(product)}
                          >
                            🛒
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="pagination">
                <button
                  className="btn btn-secondary"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  &larr; Prev
                </button>
                <span className="page-info">Page {page}</span>
                <button
                  className="btn btn-secondary"
                  disabled={products.length < pageSize}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next &rarr;
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setSelectedProduct(null)}>
              &times;
            </button>
            
            <div className="modal-grid">
              {/* Product Image */}
              <div className="modal-image-col">
                <img
                  src={selectedProduct.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"}
                  alt={selectedProduct.title}
                />
              </div>

              {/* Product Specifications & Purchase options */}
              <div className="modal-info-col">
                <span className="modal-category">{selectedProduct.category}</span>
                <h2>{selectedProduct.title}</h2>
                <div className="modal-ratings">
                  {"⭐".repeat(Math.round(selectedProduct.averageRating || 0))}
                  <span className="review-count">({reviews.length} reviews)</span>
                </div>
                
                <h3 className="modal-price">
                  ₹{selectedProduct.price}{" "}
                  {selectedProduct.discount > 0 && (
                    <span className="modal-discount-tag">Save ₹{selectedProduct.discount}</span>
                  )}
                </h3>
                
                <p className="modal-desc">{selectedProduct.description}</p>

                {selectedProduct.brand && (
                  <p className="spec-item">
                    <strong>Brand:</strong> {selectedProduct.brand}
                  </p>
                )}
                {selectedProduct.sku && (
                  <p className="spec-item">
                    <strong>SKU:</strong> {selectedProduct.sku}
                  </p>
                )}

                {/* Variants Selection */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="variants-section">
                    <h4>Select Options</h4>
                    {(() => {
                      const { colors, sizes } = getColorsAndSizes(selectedProduct.variants);
                      return (
                        <div className="variants-selectors">
                          {colors.length > 0 && (
                            <div className="selector-group">
                              <label>Color</label>
                              <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)}>
                                <option value="">Select Color</option>
                                {colors.map(col => <option key={col} value={col}>{col}</option>)}
                              </select>
                            </div>
                          )}
                          {sizes.length > 0 && (
                            <div className="selector-group">
                              <label>Size</label>
                              <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
                                <option value="">Select Size</option>
                                {sizes.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {selectedColor && selectedSize && !selectedVariant && (
                      <span className="variant-error">⚠️ Selected color/size combo is unavailable.</span>
                    )}
                    {selectedVariant && (
                      <span className="variant-stock-info">
                        In Stock: <strong>{selectedVariant.stock} units</strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Quantity and Actions */}
                <div className="modal-purchase-actions">
                  <div className="qty-picker">
                    <button onClick={() => setQuantity(q => Math.max(q - 1, 1))}>-</button>
                    <span>{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)}>+</button>
                  </div>
                  <button className="btn btn-primary" onClick={() => handleAddCart(selectedProduct)}>
                    🛒 Add to Cart
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleAddWishlist(selectedProduct)}>
                    ❤️ Wishlist
                  </button>
                </div>

                {/* Reviews Toggle Section */}
                <div className="modal-tabs-header">
                  <button
                    className={`tab-header-btn ${!showReviews ? "active" : ""}`}
                    onClick={() => setShowReviews(false)}
                  >
                    Product Info
                  </button>
                  <button
                    className={`tab-header-btn ${showReviews ? "active" : ""}`}
                    onClick={() => setShowReviews(true)}
                  >
                    Reviews ({reviews.length})
                  </button>
                </div>

                <div className="modal-tab-content">
                  {!showReviews ? (
                    <div className="additional-specs">
                      {selectedProduct.weight && <p><strong>Weight:</strong> {selectedProduct.weight} kg</p>}
                      {selectedProduct.dimensions && <p><strong>Dimensions:</strong> {selectedProduct.dimensions}</p>}
                      {selectedProduct.shippingCharges !== undefined && (
                        <p><strong>Shipping Charges:</strong> ₹{selectedProduct.shippingCharges}</p>
                      )}
                    </div>
                  ) : (
                    <div className="reviews-section">
                      {reviews.length === 0 ? (
                        <p className="no-reviews">No reviews for this product yet.</p>
                      ) : (
                        <div className="reviews-list">
                          {reviews.map((rev) => (
                            <div key={rev.id} className="review-card card">
                              <div className="review-header">
                                <strong>{rev.userName}</strong>
                                <span>{"⭐".repeat(rev.rating)}</span>
                              </div>
                              <p className="review-text">{rev.reviewText}</p>
                              {rev.sellerReply && (
                                <div className="seller-reply">
                                  <strong>Seller Reply:</strong>
                                  <p>{rev.sellerReply}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {currentUser && (
                        <form onSubmit={handleSubmitReview} className="write-review-form">
                          <h4>Write a Review</h4>
                          <div className="form-group">
                            <label>Rating</label>
                            <select
                              value={reviewRating}
                              onChange={(e) => setReviewRating(parseInt(e.target.value))}
                            >
                              <option value="5">5 Stars</option>
                              <option value="4">4 Stars</option>
                              <option value="3">3 Stars</option>
                              <option value="2">2 Stars</option>
                              <option value="1">1 Star</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Your Review</label>
                            <textarea
                              required
                              rows="3"
                              placeholder="Share your experience..."
                              value={reviewText}
                              onChange={(e) => setReviewText(e.target.value)}
                            />
                          </div>
                          <button type="submit" className="btn btn-primary">
                            Submit Review
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Product;