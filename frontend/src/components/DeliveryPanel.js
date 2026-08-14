import { useState, useEffect } from "react";
import { orderService } from "../services/api";

function DeliveryPanel() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await orderService.getOrders();
      if (res.success) {
        // Filter out completed or cancelled orders if desired, or show all
        setDeliveries(res.data);
      }
    } catch (err) {
      console.error("Error fetching deliveries:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDelivery = async (e) => {
    e.preventDefault();
    if (!otp) return;
    
    setVerifying(true);
    try {
      const res = await orderService.verifyDelivery(selectedOrder.id, otp);
      if (res.success) {
        alert("🎉 Delivery verified and completed successfully!");
        setSelectedOrder(null);
        setOtp("");
        fetchDeliveries();
      } else {
        alert(`❌ Verification failed: ${res.message}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Invalid OTP code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="orders-container">
      <h2 className="orders-title">🚚 Delivery Partner Workspace</h2>

      {loading && deliveries.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading delivery assignments...</p>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="empty-state card">
          <h3>No assigned shipments</h3>
          <p>Check back later for delivery orders.</p>
        </div>
      ) : (
        <div className="orders-layout">
          {/* Deliveries List */}
          <div className="orders-list-col">
            <h3>Assigned Shipments</h3>
            {deliveries.map((order) => (
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
                  <span>ETA: {new Date(order.estimatedDeliveryDate).toLocaleDateString()}</span>
                  <span>Amount: <b>₹ {order.finalAmount}</b></span>
                </div>
              </div>
            ))}
          </div>

          {/* Verification Pane */}
          <div className="orders-tracking-col">
            {selectedOrder ? (
              <div className="order-tracking-details card">
                <h3>Verify Delivery Assignment</h3>
                
                <div className="details-meta-block">
                  <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                  <p><strong>Client ID:</strong> {selectedOrder.userId}</p>
                  <p><strong>Payment Status:</strong> {selectedOrder.paymentStatus}</p>
                  <p><strong>Delivery Address ID:</strong> {selectedOrder.shippingAddressId}</p>
                  <p><strong>Order Status:</strong> <span className="badge badge-warning">{selectedOrder.status}</span></p>
                </div>

                {selectedOrder.status !== "Completed" && selectedOrder.status !== "Cancelled" ? (
                  <form onSubmit={handleVerifyDelivery} className="order-status-update-form">
                    <h4>OTP Delivery Verification</h4>
                    <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                      Ask the customer for their 4-digit verification OTP to complete this delivery.
                    </p>
                    
                    <div className="form-group">
                      <label>Verification OTP *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1234"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>
                    
                    <button type="submit" disabled={verifying} className="btn btn-success">
                      {verifying ? "Verifying..." : "Verify & Mark Completed"}
                    </button>
                  </form>
                ) : (
                  <div className="auth-alert alert-success">
                    This order delivery is already finalized ({selectedOrder.status}).
                  </div>
                )}
              </div>
            ) : (
              <div className="order-tracking-placeholder card">
                <span className="placeholder-icon">🚚</span>
                <h3>Select a shipment</h3>
                <p>Choose an assignment on the left to verify delivery OTPs and review address info.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryPanel;
