import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { orderService, cartService } from "../services/api";
import "./Checkout.css";

function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Passed from Cart page
  const passedCouponCode = location.state?.couponCode || "";
  
  const [addresses, setAddresses] = useState([]);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Checkout form selection states
  const [shippingAddressId, setShippingAddressId] = useState("");
  const [billingAddressId, setBillingAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [couponCode, setCouponCode] = useState(passedCouponCode);
  
  // New Address Form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [label, setLabel] = useState("Home");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("India");
  const [isDefault, setIsDefault] = useState(false);

  // Payment Sandbox state
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxGateway, setSandboxGateway] = useState("stripe"); // 'stripe' or 'razorpay'
  const [sandboxPaymentStatus, setSandboxPaymentStatus] = useState("idle"); // 'idle', 'paying', 'success'
  
  // Stripe form values
  const [stripeCardNumber, setStripeCardNumber] = useState("");
  const [stripeExpiry, setStripeExpiry] = useState("");
  const [stripeCvv, setStripeCvv] = useState("");
  const [stripeName, setStripeName] = useState("");
  
  // Razorpay form values
  const [razorpayUpi, setRazorpayUpi] = useState("");
  const [razorpayBank, setRazorpayBank] = useState("SBI");

  useEffect(() => {
    fetchAddresses();
    fetchCart();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await orderService.getAddresses();
      if (res.success) {
        setAddresses(res.data);
        // Auto-select defaults
        const defaultAddr = res.data.find(a => a.isDefault);
        if (defaultAddr) {
          setShippingAddressId(defaultAddr.id);
          setBillingAddressId(defaultAddr.id);
        } else if (res.data.length > 0) {
          setShippingAddressId(res.data[0].id);
          setBillingAddressId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await cartService.getCart();
      if (res.success) {
        setCart(res.data);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!fullName || !phone || !line1 || !city || !stateName || !postalCode) {
      alert("⚠️ All fields marked with * are required.");
      return;
    }

    try {
      const res = await orderService.createAddress({
        label,
        type: label === "Home" ? "shipping" : "billing",
        fullName,
        phone,
        line1,
        line2,
        city,
        state: stateName,
        postalCode,
        country,
        isDefault
      });
      
      if (res.success) {
        alert("✅ Address added successfully!");
        setShowAddressForm(false);
        fetchAddresses();
        // Clear address form
        setFullName("");
        setPhone("");
        setLine1("");
        setLine2("");
        setCity("");
        setStateName("");
        setPostalCode("");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add address.");
    }
  };

  const handlePlaceOrder = async () => {
    if (!shippingAddressId || !billingAddressId) {
      alert("⚠️ Please specify both shipping and billing addresses.");
      return;
    }

    if (paymentMethod === "CashOnDelivery") {
      setLoading(true);
      try {
        const res = await orderService.checkout({
          shippingAddressId,
          billingAddressId,
          paymentMethod: "CashOnDelivery",
          couponCode: couponCode || undefined
        });

        if (res.success && res.data) {
          alert(`🎉 Order placed successfully!\n🔑 Your Delivery Verification OTP is: ${res.data.otp || "Sent to your phone"}`);
          navigate("/user/orders");
        } else {
          alert(`❌ Failed: ${res.message}`);
        }
      } catch (err) {
        alert(err.response?.data?.message || "Failed to place order. Double check stocks or addresses.");
      } finally {
        setLoading(false);
      }
    } else {
      setSandboxPaymentStatus("idle");
      if (paymentMethod === "UPI" || paymentMethod === "NetBanking") {
        setSandboxGateway("razorpay");
      } else {
        setSandboxGateway("stripe");
      }
      setShowSandbox(true);
    }
  };

  const handleSandboxPaymentSubmit = async (e) => {
    e.preventDefault();

    if (sandboxGateway === "stripe") {
      if (!stripeCardNumber || !stripeExpiry || !stripeCvv || !stripeName) {
        alert("⚠️ Please fill in all credit card details.");
        return;
      }
    } else {
      if (paymentMethod === "UPI" && !razorpayUpi) {
        alert("⚠️ Please enter your UPI ID.");
        return;
      }
    }

    setSandboxPaymentStatus("paying");

    setTimeout(() => {
      setSandboxPaymentStatus("success");

      setTimeout(async () => {
        setShowSandbox(false);
        setLoading(true);

        try {
          const finalGateway = sandboxGateway === "stripe" ? "StripeTest" : "RazorpayTest";
          const res = await orderService.checkout({
            shippingAddressId,
            billingAddressId,
            paymentMethod: finalGateway,
            couponCode: couponCode || undefined
          });

          if (res.success && res.data) {
            alert(`🎉 Order placed and paid successfully via ${sandboxGateway === "stripe" ? "Stripe Sandbox" : "Razorpay Sandbox"}!\n🔑 Your Delivery Verification OTP is: ${res.data.otp || "Sent to your phone"}`);
            navigate("/user/orders");
          } else {
            alert(`❌ Checkout failed: ${res.message}`);
          }
        } catch (err) {
          alert(err.response?.data?.message || "Failed to complete transaction.");
        } finally {
          setLoading(false);
        }
      }, 1500);
    }, 2000);
  };

  if (!cart) {
    return (
      <div className="checkout-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Preparing checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <h2 className="checkout-title">🔒 Secure Checkout</h2>

      <div className="checkout-grid">
        {/* Left Side: Address & Payment */}
        <div className="checkout-left-col">
          {/* Address Section */}
          <section className="checkout-section card">
            <div className="section-header-row">
              <h3>1. Select Delivery Address</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowAddressForm(true)}>
                + New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <p className="no-address-alert">No saved addresses found. Please add a new address to continue.</p>
            ) : (
              <div className="address-selections">
                <div className="address-selector-block">
                  <label>Shipping Address</label>
                  <select value={shippingAddressId} onChange={(e) => setShippingAddressId(e.target.value)}>
                    {addresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        {addr.fullName} ({addr.label}) - {addr.line1}, {addr.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="address-selector-block">
                  <label>Billing Address</label>
                  <select value={billingAddressId} onChange={(e) => setBillingAddressId(e.target.value)}>
                    {addresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        {addr.fullName} ({addr.label}) - {addr.line1}, {addr.city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* Payment Selection */}
          <section className="checkout-section card">
            <h3>2. Choose Payment Method</h3>
            <div className="payment-options-grid">
              {[
                { id: "UPI", label: "UPI (GPay / PhonePe)", desc: "Scan and Pay instantly" },
                { id: "CreditCard", label: "Credit Card", desc: "Visa, MasterCard, Amex" },
                { id: "DebitCard", label: "Debit Card", desc: "All Indian banks supported" },
                { id: "NetBanking", label: "Net Banking", desc: "Pay via secure bank gateway" },
                { id: "CashOnDelivery", label: "Cash on Delivery (CoD)", desc: "Pay on OTP verification" }
              ].map(opt => (
                <div
                  key={opt.id}
                  className={`payment-option-card ${paymentMethod === opt.id ? "selected" : ""}`}
                  onClick={() => setPaymentMethod(opt.id)}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === opt.id}
                    onChange={() => setPaymentMethod(opt.id)}
                  />
                  <div className="payment-opt-info">
                    <strong>{opt.label}</strong>
                    <small>{opt.desc}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Side: Order Review & Apply Coupon */}
        <aside className="checkout-right-col card">
          <h3>Order Review</h3>
          <div className="checkout-items-preview">
            {cart.items.filter(i => !i.saveForLater).map(item => (
              <div key={item.id} className="checkout-item-line">
                <span className="item-title-qty">
                  {item.productTitle} <b>x{item.quantity}</b>
                </span>
                <span className="item-line-price">₹ {item.productPrice * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="summary-breakdown">
            <div className="summary-row">
              <span>Cart Subtotal</span>
              <span>₹ {cart.subtotal}</span>
            </div>
            {cart.totalDiscount > 0 && (
              <div className="summary-row text-success">
                <span>Product Discounts</span>
                <span>- ₹ {cart.totalDiscount}</span>
              </div>
            )}
            <div className="summary-row">
              <span>GST Tax (18%)</span>
              <span>₹ {cart.tax}</span>
            </div>
            <div className="summary-row">
              <span>Shipping Charges</span>
              <span>{cart.shippingEstimate === 0 ? "FREE" : `₹ ${cart.shippingEstimate}`}</span>
            </div>

            <div className="checkout-coupon-review">
              <label>Applied Coupon</label>
              <input
                type="text"
                placeholder="NO COUPON APPLIED"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              />
            </div>

            <div className="summary-row total-row">
              <span>Grand Total</span>
              <span>₹ {cart.finalTotal}</span>
            </div>
          </div>

          <button
            className="btn btn-primary place-order-btn"
            disabled={loading}
            onClick={handlePlaceOrder}
          >
            {loading ? "Placing Order..." : "Place Order & Pay"}
          </button>
        </aside>
      </div>

      {/* Address Form Dialog modal */}
      {showAddressForm && (
        <div className="modal-overlay" onClick={() => setShowAddressForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowAddressForm(false)}>
              &times;
            </button>
            <h3>Add New Address</h3>
            <form onSubmit={handleAddAddress} className="address-form-modal">
              <div className="form-group">
                <label>Address Label</label>
                <select value={label} onChange={(e) => setLabel(e.target.value)}>
                  <option value="Home">Home (Shipping default)</option>
                  <option value="Office">Office</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Address Line 1 *</label>
                <input
                  type="text"
                  required
                  placeholder="House No, Apartment, Street"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Address Line 2</label>
                <input
                  type="text"
                  placeholder="Landmark, Area"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                />
              </div>

              <div className="price-inputs">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                  />
                </div>
              </div>

              <div className="price-inputs">
                <div className="form-group">
                  <label>Postal Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="600001"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Country *</label>
                  <input
                    type="text"
                    required
                    placeholder="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="chkDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                />
                <label htmlFor="chkDefault">Make default address</label>
              </div>

              <button type="submit" className="btn btn-primary">
                Save Address
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sandbox Payment Modal */}
      {showSandbox && (
        <div className="payment-sandbox-overlay">
          <div className="payment-sandbox-card">
            
            {sandboxPaymentStatus === "success" ? (
              <div className="sandbox-success-overlay">
                <div className="success-checkmark">✓</div>
                <h3>Payment Successful!</h3>
                <p>Transaction ID: TXN_{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
                <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>Creating your order...</p>
              </div>
            ) : null}

            {sandboxPaymentStatus === "paying" ? (
              <div className="sandbox-success-overlay" style={{ background: "rgba(30, 41, 59, 0.95)" }}>
                <div className="spinner"></div>
                <h3>Processing Payment...</h3>
                <p>Contacting {sandboxGateway === "stripe" ? "Stripe Sandbox" : "Razorpay Test Gateway"} API</p>
                <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>Please do not refresh the page or click back.</p>
              </div>
            ) : null}

            <div className="sandbox-header">
              <h3>💳 Payment Sandbox ({sandboxGateway === "stripe" ? "Stripe" : "Razorpay"} Test)</h3>
              <button className="sandbox-close-btn" onClick={() => setShowSandbox(false)} disabled={sandboxPaymentStatus !== "idle"}>
                &times;
              </button>
            </div>

            <div className="sandbox-amount-due">
              <p>Amount to Pay</p>
              <h2>₹ {cart.finalTotal}</h2>
            </div>

            <div className="sandbox-toggle-row">
              <button
                type="button"
                className={`sandbox-toggle-btn ${sandboxGateway === "stripe" ? "active" : ""}`}
                onClick={() => setSandboxGateway("stripe")}
                disabled={sandboxPaymentStatus !== "idle"}
              >
                Stripe Test Mode
              </button>
              <button
                type="button"
                className={`sandbox-toggle-btn ${sandboxGateway === "razorpay" ? "active" : ""}`}
                onClick={() => setSandboxGateway("razorpay")}
                disabled={sandboxPaymentStatus !== "idle"}
              >
                Razorpay Test Mode
              </button>
            </div>

            <form onSubmit={handleSandboxPaymentSubmit} className="sandbox-form">
              {sandboxGateway === "stripe" ? (
                // Stripe Test View
                <>
                  <div className="sandbox-tip">
                    <span>💡</span>
                    <span>Stripe Sandbox: Use Card <b>4242 4242 4242 4242</b> for success.</span>
                  </div>

                  <div className="stripe-card-preview">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="card-preview-chip"></div>
                      <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#a5b4fc", fontStyle: "italic" }}>stripe</span>
                    </div>
                    <div className="card-preview-number">
                      {stripeCardNumber || "•••• •••• •••• ••••"}
                    </div>
                    <div className="card-preview-bottom">
                      <div>
                        <div style={{ fontSize: "0.6rem", color: "#94a3b8" }}>CARDHOLDER</div>
                        <div>{stripeName.toUpperCase() || "YOUR NAME"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.6rem", color: "#94a3b8", textAlign: "right" }}>EXPIRES</div>
                        <div>{stripeExpiry || "MM/YY"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="sandbox-input-group">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      className="sandbox-input"
                      placeholder="Jane Doe"
                      required
                      value={stripeName}
                      onChange={(e) => setStripeName(e.target.value)}
                    />
                  </div>

                  <div className="sandbox-input-group">
                    <label>Card Number</label>
                    <input
                      type="text"
                      className="sandbox-input"
                      placeholder="4242 4242 4242 4242"
                      required
                      maxLength="19"
                      value={stripeCardNumber}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "");
                        let matches = val.match(/\d{4,16}/g);
                        let match = (matches && matches[0]) || "";
                        let parts = [];
                        for (let i = 0, len = match.length; i < len; i += 4) {
                          parts.push(match.substring(i, i + 4));
                        }
                        if (parts.length > 0) {
                          setStripeCardNumber(parts.join(" "));
                        } else {
                          setStripeCardNumber(val);
                        }
                      }}
                    />
                  </div>

                  <div className="sandbox-row">
                    <div className="sandbox-input-group">
                      <label>Expiration</label>
                      <input
                        type="text"
                        className="sandbox-input"
                        placeholder="MM/YY"
                        required
                        maxLength="5"
                        value={stripeExpiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, "");
                          if (val.length > 2) {
                            setStripeExpiry(val.substring(0, 2) + "/" + val.substring(2, 4));
                          } else {
                            setStripeExpiry(val);
                          }
                        }}
                      />
                    </div>
                    <div className="sandbox-input-group">
                      <label>CVV / CVC</label>
                      <input
                        type="password"
                        className="sandbox-input"
                        placeholder="123"
                        required
                        maxLength="3"
                        value={stripeCvv}
                        onChange={(e) => setStripeCvv(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>
                </>
              ) : (
                // Razorpay Test View
                <>
                  <div className="sandbox-tip" style={{ borderColor: "rgba(0, 176, 255, 0.2)", color: "#00b0ff", background: "rgba(0, 176, 255, 0.05)" }}>
                    <span>💡</span>
                    <span>Razorpay Test: Enter any simulated details to trigger instant API verification.</span>
                  </div>

                  {paymentMethod === "UPI" ? (
                    <div className="sandbox-input-group">
                      <label>UPI ID (VPA)</label>
                      <input
                        type="text"
                        className="sandbox-input"
                        placeholder="success@razorpay"
                        required
                        value={razorpayUpi}
                        onChange={(e) => setRazorpayUpi(e.target.value)}
                      />
                      <small style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>e.g. user@okhdfcbank, success@razorpay</small>
                    </div>
                  ) : paymentMethod === "NetBanking" ? (
                    <div className="sandbox-input-group">
                      <label>Select Test Bank</label>
                      <div className="razorpay-bank-grid">
                        {["SBI", "HDFC", "ICICI", "AXIS", "KOTAK", "YES"].map(bank => (
                          <div
                            key={bank}
                            className={`razorpay-bank-card ${razorpayBank === bank ? "selected" : ""}`}
                            onClick={() => setRazorpayBank(bank)}
                          >
                            {bank}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="sandbox-input-group">
                      <label>Mock Card Number</label>
                      <input
                        type="text"
                        className="sandbox-input"
                        placeholder="Card ending in 1111 (Razorpay test)"
                        disabled
                        value="4111 1111 1111 1111"
                      />
                    </div>
                  )}

                  <div style={{ textAlign: "center", marginTop: "1rem", color: "#94a3b8", fontSize: "0.85rem" }}>
                    🔒 Secured by <b>razorpay</b> test sandbox
                  </div>
                </>
              )}

              <button type="submit" disabled={sandboxPaymentStatus !== "idle"} className="sandbox-pay-btn">
                Pay ₹ {cart.finalTotal}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;
