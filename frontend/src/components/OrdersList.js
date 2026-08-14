import { useState, useEffect } from "react";
import { orderService } from "../services/api";
import "./OrdersList.css";

function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    try {
      const res = await orderService.cancelOrder(orderId);
      if (res.success) {
        alert("✅ Order cancelled successfully!");
        fetchOrders();
        // Update selected order view
        const updated = await orderService.getOrderById(orderId);
        if (updated.success) setSelectedOrder(updated.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel order.");
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const blob = await orderService.downloadInvoice(orderId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Invoice_${orderId}.txt`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Error downloading invoice:", err);
      alert("Failed to download invoice.");
    }
  };

  const handleViewDetails = async (order) => {
    try {
      const res = await orderService.getOrderById(order.id);
      if (res.success) {
        setSelectedOrder(res.data);
      }
    } catch (err) {
      setSelectedOrder(order);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
      case "Delivered":
        return "badge-success";
      case "Cancelled":
        return "badge-danger";
      case "Placed":
      case "PaymentSuccessful":
        return "badge-info";
      default:
        return "badge-warning";
    }
  };

  return (
    <div className="orders-container">
      <h2 className="orders-title">📦 Order History & Tracking</h2>

      {loading && orders.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Fetching your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state card">
          <h3>No Orders Found</h3>
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="orders-layout">
          {/* List of Orders */}
          <div className="orders-list-col">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`order-list-card card ${selectedOrder?.id === order.id ? "active" : ""}`}
                onClick={() => handleViewDetails(order)}
              >
                <div className="order-card-header">
                  <span className="order-id-label">Order ID: <b>{order.id}</b></span>
                  <span className={`badge ${getStatusColor(order.status)}`}>{order.status}</span>
                </div>
                
                <div className="order-card-meta">
                  <span>Date: {new Date(order.orderDate).toLocaleDateString()}</span>
                  <span>Amount: <b>₹ {order.finalAmount}</b></span>
                </div>

                <div className="order-card-footer">
                  <span className="courier-note">
                    {order.courierPartner ? `Courier: ${order.courierPartner}` : "Awaiting dispatch"}
                  </span>
                  <button className="btn-sm btn-link">Track Order &rarr;</button>
                </div>
              </div>
            ))}
          </div>

          {/* Tracking Details View */}
          <div className="orders-tracking-col">
            {selectedOrder ? (
              <div className="order-tracking-details card">
                <div className="details-header-row">
                  <h3>Order Details</h3>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleDownloadInvoice(selectedOrder.id)}
                  >
                    📄 Invoice
                  </button>
                </div>

                <div className="details-meta-block">
                  <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                  <p><strong>Date:</strong> {new Date(selectedOrder.orderDate).toLocaleString()}</p>
                  <p><strong>Status:</strong> <span className={`badge ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span></p>
                  <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})</p>
                  <p><strong>Estimated Delivery:</strong> {new Date(selectedOrder.estimatedDeliveryDate).toLocaleDateString()}</p>
                  {selectedOrder.courierPartner && (
                    <p>
                      <strong>Courier Partner:</strong> {selectedOrder.courierPartner} (Track #:{" "}
                      {selectedOrder.trackingNumber || "N/A"})
                    </p>
                  )}
                </div>

                {/* Delivery verification OTP */}
                {selectedOrder.status === "OutForDelivery" && (
                  <div className="otp-alert-box">
                    <span className="otp-title">📦 Out For Delivery</span>
                    <p>Provide this OTP to your courier agent upon receiving your shipment:</p>
                    <span className="otp-code-highlight">{selectedOrder.otp || "9834"}</span>
                  </div>
                )}

                {/* Visual Timeline */}
                <div className="timeline-wrapper">
                  <h4>Delivery Tracking Timeline</h4>
                  <div className="timeline-events">
                    {selectedOrder.trackingTimeline && selectedOrder.trackingTimeline.length > 0 ? (
                      selectedOrder.trackingTimeline.map((evt, idx) => (
                        <div key={idx} className="timeline-event">
                          <div className="timeline-node"></div>
                          <div className="timeline-content">
                            <span className="timeline-status-text">{evt.status}</span>
                            <span className="timeline-time">
                              {new Date(evt.timestamp).toLocaleString()}
                            </span>
                            <p className="timeline-detail">{evt.detail}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-timeline-alert">No tracking timeline updates logged yet.</p>
                    )}
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="summary-breakdown tracking-summary">
                  <div className="summary-row">
                    <span>Cart Subtotal</span>
                    <span>₹ {selectedOrder.totalAmount}</span>
                  </div>
                  <div className="summary-row text-danger">
                    <span>Discounts Applied</span>
                    <span>- ₹ {selectedOrder.discountAmount}</span>
                  </div>
                  <div className="summary-row">
                    <span>GST Tax (18%)</span>
                    <span>₹ {selectedOrder.taxAmount}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping Charges</span>
                    <span>₹ {selectedOrder.shippingCharges}</span>
                  </div>
                  <div className="summary-row total-row">
                    <span>Amount Charged</span>
                    <span>₹ {selectedOrder.finalAmount}</span>
                  </div>
                </div>

                {/* Order Cancellation */}
                {["Placed", "PaymentSuccessful", "Accepted", "Packed"].includes(selectedOrder.status) && (
                  <div className="order-cancel-zone">
                    <button className="btn btn-danger" onClick={() => handleCancel(selectedOrder.id)}>
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="order-tracking-placeholder card">
                <span className="placeholder-icon">📦</span>
                <h3>Select an order to track</h3>
                <p>Click on any order in your list to view its shipment timeline and download invoices.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersList;
