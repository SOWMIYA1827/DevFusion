import { useState, useEffect } from "react";
import { cartService } from "../services/api";
import "./Favorites.css";

function Favorites() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await cartService.getWishlist();
      if (res.success) {
        setWishlist(res.data);
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      const res = await cartService.removeFromWishlist(productId);
      if (res.success) {
        setWishlist(prev => prev.filter(item => item.productId !== productId));
      }
    } catch (err) {
      console.error("Error removing from wishlist:", err);
      alert(err.response?.data?.message || "Failed to remove item.");
    }
  };

  const handleMoveToCart = async (item) => {
    try {
      const res = await cartService.addToCart(item.productId, 1);
      if (res.success) {
        // Also remove from wishlist
        await cartService.removeFromWishlist(item.productId);
        setWishlist(prev => prev.filter(w => w.productId !== item.productId));
        alert("🛒 Product moved to Cart!");
      }
    } catch (err) {
      console.error("Error moving to cart:", err);
      alert(err.response?.data?.message || "Failed to move to cart.");
    }
  };

  return (
    <div className="favorites-container">
      <h2 className="favorites-title">❤️ My Wishlist</h2>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading wishlist...</p>
        </div>
      ) : wishlist.length === 0 ? (
        <div className="empty-state card">
          <h3>Your wishlist is empty</h3>
          <p>Browse products and tap the heart icon to save products here.</p>
        </div>
      ) : (
        <div className="favorites-grid">
          {wishlist.map((item) => (
            <div className="favorite-card card" key={item.id}>
              <div className="favorite-image-container">
                <img
                  className="favorite-img"
                  src={item.productImage || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"}
                  alt={item.productTitle}
                />
                <button
                  className="remove-wishlist-btn"
                  title="Remove from Wishlist"
                  onClick={() => handleRemove(item.productId)}
                >
                  &times;
                </button>
              </div>

              <div className="favorite-details">
                <h3 className="favorite-name">{item.productTitle}</h3>
                <p className="favorite-price">₹ {item.productPrice}</p>
                <button
                  className="btn btn-primary cart-btn"
                  onClick={() => handleMoveToCart(item)}
                >
                  🛒 Move to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;