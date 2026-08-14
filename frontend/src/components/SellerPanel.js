import { useState, useEffect } from "react";
import { sellerService, productService, orderService } from "../services/api";
import "./SellerPanel.css";

function SellerPanel() {
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard', 'store', 'products', 'orders', 'coupons'
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Store setup state
  const [storeName, setStoreName] = useState("");
  const [storeDesc, setStoreDesc] = useState("");
  const [storeLogo, setStoreLogo] = useState("");
  const [storeBanner, setStoreBanner] = useState("");
  const [storeSetupSuccess, setStoreSetupSuccess] = useState(false);

  // Products CRUD states
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Product Form states
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [discount, setDiscount] = useState("");
  const [stock, setStock] = useState("");
  const [weight, setWeight] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [shippingCharges, setShippingCharges] = useState("");

  // Product Variants state
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variantProductId, setVariantProductId] = useState(null);
  const [variantSize, setVariantSize] = useState("");
  const [variantColor, setVariantColor] = useState("");
  const [variantStock, setVariantStock] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [variantSku, setVariantSku] = useState("");

  // CSV Bulk Import state
  const [importFile, setImportFile] = useState(null);

  // Coupons State
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState("Percentage"); // 'Percentage', 'Flat'
  const [couponValue, setCouponValue] = useState("");
  const [couponMaxDisc, setCouponMaxDisc] = useState("");
  const [couponMinOrder, setCouponMinOrder] = useState("");
  const [couponExpiry, setCouponExpiry] = useState("");

  // Review reply state
  const [replyReviewId, setReplyReviewId] = useState(null);
  const [replyText, setReplyText] = useState("");

  // Orders State
  const [sellerOrders, setSellerOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState("Accepted");
  const [courierPartner, setCourierPartner] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [estDeliveryDays, setEstDeliveryDays] = useState("");

  // Load Dashboard Data
  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await sellerService.getDashboard();
      if (res.success) {
        setDashboard(res.data);
        // Load products for this seller (via top products or fetch from category)
        if (res.data.topProducts && res.data.topProducts.length > 0) {
          const storeId = res.data.topProducts[0].storeId;
          fetchSellerProducts(storeId);
        } else {
          // If no top products, fetch all to display
          fetchSellerProducts();
        }
        fetchSellerOrders();
      }
    } catch (err) {
      console.warn("Seller dashboard failed. Possibly no store setup yet.", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerProducts = async (storeId) => {
    try {
      const res = await productService.getProducts({ storeId });
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error("Error fetching seller products:", err);
    }
  };

  const fetchSellerOrders = async () => {
    try {
      const res = await orderService.getOrders();
      if (res.success) {
        setSellerOrders(res.data);
      }
    } catch (err) {
      console.error("Error fetching seller orders:", err);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    try {
      const res = await sellerService.createStore({
        name: storeName,
        description: storeDesc,
        logoUrl: storeLogo,
        bannerUrl: storeBanner
      });
      if (res.success) {
        setStoreSetupSuccess(true);
        alert("✅ Storefront created successfully!");
        fetchDashboard();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to setup storefront.");
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const productData = {
      title,
      price: parseFloat(price),
      description: desc,
      category,
      image,
      sku,
      barcode,
      discount: discount ? parseFloat(discount) : 0,
      stock: parseInt(stock),
      weight: weight ? parseFloat(weight) : undefined,
      dimensions,
      shippingCharges: shippingCharges ? parseFloat(shippingCharges) : 0
    };

    try {
      let res;
      if (editingProduct) {
        res = await productService.updateProduct(editingProduct.id, productData);
      } else {
        res = await productService.createProduct(productData);
      }

      if (res.success) {
        alert(editingProduct ? "✏ Product updated!" : "➕ Product created!");
        setShowProductModal(false);
        fetchDashboard();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed.");
    }
  };

  const handleEditClick = (prod) => {
    setEditingProduct(prod);
    setTitle(prod.title);
    setPrice(prod.price);
    setDesc(prod.description);
    setCategory(prod.category);
    setImage(prod.image);
    setSku(prod.sku);
    setBarcode(prod.barcode);
    setDiscount(prod.discount);
    setStock(prod.stock);
    setWeight(prod.weight || "");
    setDimensions(prod.dimensions || "");
    setShippingCharges(prod.shippingCharges || "");
    setShowProductModal(true);
  };

  const handleAddNewClick = () => {
    setEditingProduct(null);
    setTitle("");
    setPrice("");
    setDesc("");
    setCategory("");
    setImage("");
    setSku("");
    setBarcode("");
    setDiscount("");
    setStock("10");
    setWeight("");
    setDimensions("");
    setShippingCharges("");
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await productService.deleteProduct(id);
      if (res.success) {
        alert("🗑 Product deleted!");
        fetchDashboard();
      }
    } catch (err) {
      alert("Failed to delete product.");
    }
  };

  const handleVariantSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await productService.createVariant(variantProductId, {
        size: variantSize,
        color: variantColor,
        stock: parseInt(variantStock),
        price: parseFloat(variantPrice),
        sku: variantSku
      });
      if (res.success) {
        alert("✅ Variant created successfully!");
        setShowVariantModal(false);
        fetchDashboard();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create variant.");
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    try {
      const res = await productService.bulkImport(importFile);
      if (res.success) {
        alert("✅ Bulk import completed successfully!");
        setImportFile(null);
        fetchDashboard();
      }
    } catch (err) {
      alert("Bulk import failed. Please upload a valid CSV file.");
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const res = await sellerService.createCoupon({
        code: couponCode,
        discountType: couponType,
        value: parseFloat(couponValue),
        maxDiscount: couponMaxDisc ? parseFloat(couponMaxDisc) : undefined,
        minOrderAmount: couponMinOrder ? parseFloat(couponMinOrder) : undefined,
        expiryDate: new Date(couponExpiry)
      });
      if (res.success) {
        alert("🎟 Coupon code created!");
        setCouponCode("");
        setCouponValue("");
        setCouponMaxDisc("");
        setCouponMinOrder("");
        setCouponExpiry("");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create coupon.");
    }
  };

  const handleReplyReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await sellerService.replyToReview(replyReviewId, replyText);
      if (res.success) {
        alert("✅ Reply submitted!");
        setReplyReviewId(null);
        setReplyText("");
        fetchDashboard();
      }
    } catch (err) {
      alert("Failed to post reply.");
    }
  };

  const handleUpdateOrderStatus = async (e) => {
    e.preventDefault();
    try {
      const res = await orderService.updateOrderStatus(
        selectedOrder.id,
        orderStatus,
        courierPartner,
        trackingNumber,
        estDeliveryDays
      );
      if (res.success) {
        alert("✅ Order status updated!");
        setSelectedOrder(null);
        fetchSellerOrders();
        fetchDashboard();
      }
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  return (
    <div className="seller-container">
      <div className="seller-header-row">
        <h2 className="seller-title">⚙️ Seller Center</h2>
        <div className="seller-tabs">
          {[
            { id: "dashboard", label: "📊 Sales Dashboard" },
            { id: "products", label: "📦 Manage Inventory" },
            { id: "orders", label: "🛒 Client Orders" },
            { id: "coupons", label: "🎟 Coupon System" },
            { id: "store", label: "🏪 My Storefront" }
          ].map(tab => (
            <button
              key={tab.id}
              className={`seller-tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !dashboard && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading seller panel...</p>
        </div>
      )}

      {/* Onboarding fallback when no dashboard/store is set up yet */}
      {activeTab === "dashboard" && !loading && !dashboard && (
        <div className="seller-dashboard-tab card" style={{ textAlign: "center", padding: "40px", maxWidth: "600px", margin: "40px auto" }}>
          <span style={{ fontSize: "3rem", display: "block", marginBottom: "20px" }}>🏪</span>
          <h2>Welcome to NexShop Seller Center!</h2>
          <p style={{ color: "#888", margin: "15px 0 25px 0" }}>
            You haven't set up your storefront yet. Configure your store now to start selling and tracking your metrics!
          </p>
          <button 
            onClick={() => setActiveTab("store")} 
            className="btn btn-primary"
            style={{ padding: "10px 20px" }}
          >
            Configure Storefront Now
          </button>
        </div>
      )}

      {/* 1. SALES DASHBOARD */}
      {activeTab === "dashboard" && dashboard && (
        <div className="seller-dashboard-tab">
          <div className="metrics-grid">
            <div className="metric-card card">
              <span className="metric-icon">💰</span>
              <div className="metric-data">
                <h4>Total Revenue</h4>
                <h2>₹ {dashboard.totalRevenue}</h2>
              </div>
            </div>

            <div className="metric-card card">
              <span className="metric-icon">📦</span>
              <div className="metric-data">
                <h4>Total Sales</h4>
                <h2>{dashboard.totalOrders} items</h2>
              </div>
            </div>

            <div className="metric-card card">
              <span className="metric-icon">⏳</span>
              <div className="metric-data">
                <h4>Pending Orders</h4>
                <h2>{dashboard.pendingOrders}</h2>
              </div>
            </div>

            <div className="metric-card card warning">
              <span className="metric-icon">⚠️</span>
              <div className="metric-data">
                <h4>Low Stock Alerts</h4>
                <h2>{dashboard.lowStockAlertsCount} alerts</h2>
              </div>
            </div>
          </div>

          <div className="seller-dashboard-sections">
            {/* Recent Product Reviews */}
            <div className="dashboard-sub-section card">
              <h3>Product Reviews & Feedback</h3>
              {dashboard.recentReviews && dashboard.recentReviews.length > 0 ? (
                <div className="dashboard-reviews-list">
                  {dashboard.recentReviews.map(rev => (
                    <div key={rev.id} className="review-feedback-line">
                      <div className="review-feedback-header">
                        <strong>{rev.userName}</strong> on <span>{rev.productName}</span>
                        <span>{"⭐".repeat(rev.rating)}</span>
                      </div>
                      <p>{rev.reviewText}</p>
                      {rev.sellerReply ? (
                        <div className="seller-replied-text">
                          <b>Your Reply:</b> {rev.sellerReply}
                        </div>
                      ) : (
                        <div className="reply-actions">
                          {replyReviewId === rev.id ? (
                            <form onSubmit={handleReplyReviewSubmit} className="review-reply-form">
                              <textarea
                                required
                                rows="2"
                                placeholder="Write reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                              />
                              <div className="form-buttons">
                                <button type="submit" className="btn btn-primary btn-sm">Submit</button>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReplyReviewId(null)}>Cancel</button>
                              </div>
                            </form>
                          ) : (
                            <button className="action-link" onClick={() => { setReplyReviewId(rev.id); setReplyText(""); }}>
                              Reply to Review
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-item-alert">No reviews logged yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. STOREFRONT SETUP */}
      {activeTab === "store" && (
        <div className="seller-store-tab card">
          <h3>🏪 Storefront Configuration</h3>
          {storeSetupSuccess ? (
            <div className="auth-alert alert-success">Store configuration saved successfully!</div>
          ) : (
            <form onSubmit={handleCreateStore} className="store-config-form">
              <div className="form-group">
                <label>Store Name *</label>
                <input
                  type="text"
                  required
                  placeholder="My Store Name"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Store Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe what your store sells..."
                  value={storeDesc}
                  onChange={(e) => setStoreDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Store Logo URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={storeLogo}
                  onChange={(e) => setStoreLogo(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Banner URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={storeBanner}
                  onChange={(e) => setStoreBanner(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary">Save Settings</button>
            </form>
          )}
        </div>
      )}

      {/* 3. MANAGE PRODUCTS */}
      {activeTab === "products" && (
        <div className="seller-products-tab">
          <div className="products-tab-actions">
            <button className="btn btn-primary" onClick={handleAddNewClick}>
              + Add New Product
            </button>

            {/* CSV Import form */}
            <form onSubmit={handleBulkImport} className="csv-import-form card">
              <label>Bulk CSV Import</label>
              <div className="import-row">
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setImportFile(e.target.files[0])}
                />
                <button type="submit" className="btn btn-secondary btn-sm" disabled={!importFile}>
                  Upload
                </button>
              </div>
            </form>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>SKU</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">No products published. Add one above!</td>
                  </tr>
                ) : (
                  products.map(prod => (
                    <tr key={prod.id}>
                      <td>
                        <img
                          src={prod.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"}
                          alt={prod.title}
                          style={{ width: "40px", height: "40px", objectFit: "contain" }}
                        />
                      </td>
                      <td><strong>{prod.title}</strong></td>
                      <td>{prod.category}</td>
                      <td>₹ {prod.price}</td>
                      <td>
                        <span className={prod.stock <= 5 ? "badge badge-danger" : "badge badge-success"}>
                          {prod.stock} units
                        </span>
                      </td>
                      <td><code>{prod.sku || "N/A"}</code></td>
                      <td>
                        <div className="table-row-actions">
                          <button className="action-link" onClick={() => handleEditClick(prod)}>Edit</button>
                          <button className="action-link" onClick={() => { setVariantProductId(prod.id); setShowVariantModal(true); }}>+ Variant</button>
                          <button className="action-link text-danger" onClick={() => handleDeleteProduct(prod.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CLIENT ORDERS */}
      {activeTab === "orders" && (
        <div className="seller-orders-tab">
          <div className="orders-layout">
            <div className="orders-list-col">
              <h3>Store Order Processing</h3>
              {sellerOrders.length === 0 ? (
                <p className="no-item-alert">No client orders placed.</p>
              ) : (
                sellerOrders.map(order => (
                  <div
                    key={order.id}
                    className={`order-list-card card ${selectedOrder?.id === order.id ? "active" : ""}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="order-card-header">
                      <span>Order #: <b>{order.id.slice(0, 8)}</b></span>
                      <span className="badge badge-warning">{order.status}</span>
                    </div>
                    <div className="order-card-meta">
                      <span>Date: {new Date(order.orderDate).toLocaleDateString()}</span>
                      <span>Total: <b>₹ {order.finalAmount}</b></span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="orders-tracking-col">
              {selectedOrder ? (
                <div className="order-tracking-details card">
                  <h3>Process Order Details</h3>
                  <div className="details-meta-block">
                    <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                    <p><strong>Client ID:</strong> {selectedOrder.userId}</p>
                    <p><strong>Current Status:</strong> {selectedOrder.status}</p>
                    <p><strong>Payment Status:</strong> {selectedOrder.paymentStatus}</p>
                  </div>

                  {/* Status update form */}
                  <form onSubmit={handleUpdateOrderStatus} className="order-status-update-form">
                    <h4>Advance Shipment Status</h4>
                    <div className="form-group">
                      <label>New Status</label>
                      <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}>
                        <option value="Accepted">Accepted (Approve Order)</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="OutForDelivery">Out For Delivery</option>
                        <option value="Delivered">Delivered (Awaiting Customer OTP)</option>
                      </select>
                    </div>

                    {orderStatus === "Shipped" && (
                      <>
                        <div className="form-group">
                          <label>Courier Partner Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. DHL, FedEx"
                            value={courierPartner}
                            onChange={(e) => setCourierPartner(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Tracking Number</label>
                          <input
                            type="text"
                            required
                            placeholder="TRACK12345"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Estimated Delivery (Days)</label>
                          <input
                            type="number"
                            required
                            placeholder="5"
                            value={estDeliveryDays}
                            onChange={(e) => setEstDeliveryDays(e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    <button type="submit" className="btn btn-primary">Update Status</button>
                  </form>
                </div>
              ) : (
                <div className="order-tracking-placeholder card">
                  <span className="placeholder-icon">🛒</span>
                  <h3>Select an order</h3>
                  <p>Choose an order on the left to process shipping, assign tracking details, and approve sales.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. COUPON SYSTEM */}
      {activeTab === "coupons" && (
        <div className="seller-coupons-tab card">
          <h3>🎟 Manage Store Discounts</h3>
          <form onSubmit={handleCreateCoupon} className="store-config-form">
            <div className="form-group">
              <label>Coupon Code *</label>
              <input
                type="text"
                required
                placeholder="E.G. FALL50"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              />
            </div>

            <div className="price-inputs">
              <div className="form-group">
                <label>Discount Type</label>
                <select value={couponType} onChange={(e) => setCouponType(e.target.value)}>
                  <option value="Percentage">Percentage (%)</option>
                  <option value="Flat">Flat Discount (₹)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Discount Value *</label>
                <input
                  type="number"
                  required
                  placeholder="10"
                  value={couponValue}
                  onChange={(e) => setCouponValue(e.target.value)}
                />
              </div>
            </div>

            <div className="price-inputs">
              <div className="form-group">
                <label>Max Discount (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={couponMaxDisc}
                  onChange={(e) => setCouponMaxDisc(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Min Order Amount (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  value={couponMinOrder}
                  onChange={(e) => setCouponMinOrder(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Expiry Date *</label>
              <input
                type="date"
                required
                value={couponExpiry}
                onChange={(e) => setCouponExpiry(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary">Create Coupon</button>
          </form>
        </div>
      )}

      {/* MODALS */}
      {/* Product Add/Edit Modal */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowProductModal(false)}>&times;</button>
            <h3>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
            <form onSubmit={handleProductSubmit} className="product-form-modal">
              <div className="form-group">
                <label>Title *</label>
                <input type="text" required placeholder="Product Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="price-inputs">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" required placeholder="299" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Discount Amount (₹)</label>
                  <input type="number" placeholder="50" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea required rows="2" placeholder="Product details..." value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
              <div className="price-inputs">
                <div className="form-group">
                  <label>Category *</label>
                  <input type="text" required placeholder="Electronics" value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Stock Level *</label>
                  <input type="number" required placeholder="10" value={stock} onChange={(e) => setStock(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Image URL *</label>
                <input type="text" required placeholder="https://..." value={image} onChange={(e) => setImage(e.target.value)} />
              </div>
              <div className="price-inputs">
                <div className="form-group">
                  <label>SKU (Stock Keeping Unit)</label>
                  <input type="text" placeholder="PROD-TSHIRT" value={sku} onChange={(e) => setSku(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Barcode</label>
                  <input type="text" placeholder="890123..." value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                </div>
              </div>
              <div className="price-inputs">
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input type="number" step="0.01" placeholder="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Dimensions</label>
                  <input type="text" placeholder="10x10x5 cm" value={dimensions} onChange={(e) => setDimensions(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Shipping Charges (₹)</label>
                <input type="number" placeholder="40" value={shippingCharges} onChange={(e) => setShippingCharges(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary">Save Product</button>
            </form>
          </div>
        </div>
      )}

      {/* Variant Modal */}
      {showVariantModal && (
        <div className="modal-overlay" onClick={() => setShowVariantModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowVariantModal(false)}>&times;</button>
            <h3>Add Product Variant</h3>
            <form onSubmit={handleVariantSubmit} className="product-form-modal">
              <div className="price-inputs">
                <div className="form-group">
                  <label>Size</label>
                  <input type="text" placeholder="XL, L, M" value={variantSize} onChange={(e) => setVariantSize(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input type="text" placeholder="Red, Blue" value={variantColor} onChange={(e) => setVariantColor(e.target.value)} />
                </div>
              </div>
              <div className="price-inputs">
                <div className="form-group">
                  <label>Variant Price (₹) *</label>
                  <input type="number" required placeholder="299" value={variantPrice} onChange={(e) => setVariantPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Stock Level *</label>
                  <input type="number" required placeholder="10" value={variantStock} onChange={(e) => setVariantStock(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Variant SKU *</label>
                <input type="text" required placeholder="PROD-XL-RED" value={variantSku} onChange={(e) => setVariantSku(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary">Save Variant</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerPanel;
