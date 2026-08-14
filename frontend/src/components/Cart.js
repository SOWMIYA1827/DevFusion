import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cartService } from "../services/api";
import "./Cart.css";

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await cartService.getCart();
      if (res.success) {
        setCart(res.data);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (item, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(item.id);
      return;
    }
    try {
      const res = await cartService.updateCartItem(item.id, newQty, item.saveForLater);
      if (res.success) {
        fetchCart();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update quantity.");
    }
  };

  const handleToggleSaveLater = async (item) => {
    try {
      const res = await cartService.updateCartItem(item.id, item.quantity, !item.saveForLater);
      if (res.success) {
        fetchCart();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update cart item.");
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const res = await cartService.removeCartItem(itemId);
      if (res.success) {
        fetchCart();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove item.");
    }
  };

  const handleProceedCheckout = () => {
    if (!cart || !cart.items || cart.items.filter(i => !i.saveForLater).length === 0) {
      alert("⚠️ Your cart has no active items for checkout!");
      return;
    }
    // Redirect to checkout and pass the coupon code
    navigate("/user/checkout", { state: { couponCode } });
  };

  if (loading && !cart) {
    return (
      <div className="cart-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your shopping cart...</p>
        </div>
      </div>
    );
  }

  const activeItems = cart?.items?.filter(item => !item.saveForLater) || [];
  const savedItems = cart?.items?.filter(item => item.saveForLater) || [];

  return (
    <div className="cart-container">
      <h2 className="cart-title">🛒 Shopping Cart</h2>

      {activeItems.length === 0 && savedItems.length === 0 ? (
        <div className="empty-state card">
          <h3>Your cart is empty</h3>
          <p>Explore NexShop products and add them to your cart.</p>
          <button className="btn btn-primary" onClick={() => navigate("/user")}>
            Shop Now
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Items Section */}
          <div className="cart-items-section">
            {activeItems.length > 0 && (
              <div className="active-items-list">
                <h3>Active Items ({activeItems.length})</h3>
                {activeItems.map((item) => (
                  <div className="cart-item-card card" key={item.id}>
                    <img
                      className="cart-item-img"
                      src={item.productImage || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"}
                      alt={item.productTitle}
                    />
                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{item.productTitle}</h4>
                      {item.variantInfo && <span className="cart-item-variant">{item.variantInfo}</span>}
                      <p className="cart-item-price">
                        ₹ {item.productPrice}{" "}
                        {item.productDiscount > 0 && (
                          <span className="cart-discount">Save ₹{item.productDiscount}</span>
                        )}
                      </p>
                      <div className="cart-item-actions">
                        <button className="action-link text-danger" onClick={() => handleRemoveItem(item.id)}>
                          Remove
                        </button>
                        <button className="action-link" onClick={() => handleToggleSaveLater(item)}>
                          Save for Later
                        </button>
                      </div>
                    </div>

                    <div className="cart-qty-picker">
                      <button onClick={() => handleUpdateQty(item, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => handleUpdateQty(item, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {savedItems.length > 0 && (
              <div className="saved-items-list">
                <h3>Saved for Later ({savedItems.length})</h3>
                {savedItems.map((item) => (
                  <div className="cart-item-card card saved" key={item.id}>
                    <img
                      className="cart-item-img"
                      src={item.productImage || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"}
                      alt={item.productTitle}
                    />
                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{item.productTitle}</h4>
                      {item.variantInfo && <span className="cart-item-variant">{item.variantInfo}</span>}
                      <p className="cart-item-price">₹ {item.productPrice}</p>
                      <div className="cart-item-actions">
                        <button className="action-link text-danger" onClick={() => handleRemoveItem(item.id)}>
                          Remove
                        </button>
                        <button className="action-link" onClick={() => handleToggleSaveLater(item)}>
                          Move to Active Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Summary Sidebar */}
          {activeItems.length > 0 && cart && (
            <aside className="cart-summary-sidebar card">
              <h3>Order Summary</h3>
              
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹ {cart.subtotal}</span>
              </div>
              {cart.totalDiscount > 0 && (
                <div className="summary-row text-success">
                  <span>Product Discount</span>
                  <span>- ₹ {cart.totalDiscount}</span>
                </div>
              )}
              <div className="summary-row">
                <span>GST Tax (18%)</span>
                <span>₹ {cart.tax}</span>
              </div>
              <div className="summary-row">
                <span>Shipping Estimate</span>
                <span>{cart.shippingEstimate === 0 ? "FREE" : `₹ ${cart.shippingEstimate}`}</span>
              </div>

              <div className="coupon-entry-wrapper">
                <label>Promo Coupon</label>
                <div className="coupon-input-group">
                  <input
                    type="text"
                    placeholder="ENTER CODE"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                </div>
                <small className="coupon-hint">Applied during checkout checkout steps.</small>
              </div>

              <div className="summary-row total-row">
                <span>Final Total</span>
                <span>₹ {cart.finalTotal}</span>
              </div>

              <button className="btn btn-primary checkout-btn" onClick={handleProceedCheckout}>
                Proceed to Checkout
              </button>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

export default Cart;