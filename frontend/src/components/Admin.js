import { useState, useEffect } from "react";
import { adminService, productService } from "../services/api";
import "./Admin.css";

function Admin() {
  const [activeTab, setActiveTab] = useState("users"); // 'users', 'sellers', 'categories', 'orders', 'settings', 'logs'
  const [loading, setLoading] = useState(false);
  
  // Data lists
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState([]);
  const [logs, setLogs] = useState([]);

  // Create category form
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catImage, setCatImage] = useState("");

  // Platform setting form
  const [setKey, setSetKey] = useState("");
  const [setValue, setSetValue] = useState("");
  const [setGroup, setSetGroup] = useState("General");

  useEffect(() => {
    loadTabData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === "users") {
        const res = await adminService.getUsers();
        if (res.success) setUsers(res.data);
      } else if (activeTab === "sellers") {
        const res = await adminService.getSellers();
        if (res.success) setSellers(res.data);
      } else if (activeTab === "categories") {
        const res = await productService.getCategories();
        if (res.success) setCategories(res.data);
      } else if (activeTab === "orders") {
        const res = await adminService.getAllOrders();
        if (res.success) setOrders(res.data);
      } else if (activeTab === "settings") {
        const res = await adminService.getSettings();
        if (res.success) setSettings(res.data);
      } else if (activeTab === "logs") {
        const res = await adminService.getActivityLogs();
        if (res.success) setLogs(res.data);
      }
    } catch (err) {
      console.error(`Error loading admin ${activeTab} data:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (user) => {
    try {
      const res = await adminService.toggleUserStatus(user.id, !user.isActive);
      if (res.success) {
        alert(`Account active status set to ${!user.isActive}`);
        loadTabData();
      }
    } catch (err) {
      alert("Failed to toggle status.");
    }
  };

  const handleApproveSeller = async (seller, approve) => {
    try {
      const res = await adminService.approveSeller(seller.id, approve);
      if (res.success) {
        alert(`Seller approval set to ${approve}`);
        loadTabData();
      }
    } catch (err) {
      alert("Failed to update approval status.");
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catName) return;
    try {
      const res = await productService.createCategory({
        name: catName,
        description: catDesc,
        imageUrl: catImage
      });
      if (res.success) {
        alert("✅ Category created successfully!");
        setCatName("");
        setCatDesc("");
        setCatImage("");
        loadTabData();
      }
    } catch (err) {
      alert("Failed to create category.");
    }
  };

  const handleSetSetting = async (e) => {
    e.preventDefault();
    if (!setKey || !setValue) return;
    try {
      const res = await adminService.setSetting(setKey, setValue, setGroup);
      if (res.success) {
        alert("✅ Platform setting updated!");
        setSetKey("");
        setSetValue("");
        loadTabData();
      }
    } catch (err) {
      alert("Failed to save setting.");
    }
  };

  return (
    <div className="admin-layout-container">
      {/* Sidebar Navigation */}
      <aside className="admin-menu-sidebar">
        <h2 className="admin-sidebar-title">🛡️ Admin Control</h2>
        <ul className="admin-menu-list">
          {[
            { id: "users", label: "👥 Users Management" },
            { id: "sellers", label: "🏪 Sellers Approval" },
            { id: "categories", label: "📁 Categories List" },
            { id: "orders", label: "🛒 Marketplace Orders" },
            { id: "settings", label: "⚙️ Platform Settings" },
            { id: "logs", label: "📋 Audit Logs" }
          ].map(tab => (
            <li
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Panel Content */}
      <main className="admin-main-content">
        <header className="admin-content-header">
          <h2>Administrator Console</h2>
        </header>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Fetching admin reports...</p>
          </div>
        ) : (
          <div className="admin-tabs-content-wrapper">
            
            {/* 1. USERS LIST */}
            {activeTab === "users" && (
              <div className="admin-tab-pane">
                <h3>👥 Registered Marketplace Accounts</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Active Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(usr => (
                        <tr key={usr.id}>
                          <td><strong>{usr.name}</strong></td>
                          <td>{usr.email}</td>
                          <td><span className="badge badge-info">{usr.role?.name || "customer"}</span></td>
                          <td>
                            <span className={`badge ${usr.isActive ? "badge-success" : "badge-danger"}`}>
                              {usr.isActive ? "Active" : "Deactivated"}
                            </span>
                          </td>
                          <td>
                            <button
                              className={usr.isActive ? "btn-danger btn-sm" : "btn-success btn-sm"}
                              onClick={() => handleToggleUser(usr)}
                            >
                              {usr.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. SELLERS REGISTRATION */}
            {activeTab === "sellers" && (
              <div className="admin-tab-pane">
                <h3>🏪 Seller Business Approvals</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Store ID</th>
                        <th>Business Name</th>
                        <th>Verified Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellers.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center">No seller applications logged.</td>
                        </tr>
                      ) : (
                        sellers.map(sel => (
                          <tr key={sel.id}>
                            <td><code>{sel.id.slice(0, 8)}</code></td>
                            <td><strong>{sel.businessName}</strong></td>
                            <td>
                              <span className={`badge ${sel.isApproved ? "badge-success" : "badge-warning"}`}>
                                {sel.isApproved ? "Approved" : "Pending Verification"}
                              </span>
                            </td>
                            <td>
                              <div className="table-row-actions">
                                <button className="btn-success btn-sm" onClick={() => handleApproveSeller(sel, true)}>
                                  Verify / Approve
                                </button>
                                <button className="btn-danger btn-sm" onClick={() => handleApproveSeller(sel, false)}>
                                  Reject / Deactivate
                                </button>
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

            {/* 3. CATEGORIES MANAGEMENT */}
            {activeTab === "categories" && (
              <div className="admin-tab-pane category-pane-layout">
                <div className="categories-list-pane">
                  <h3>📁 Marketplace Categories</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Icon</th>
                          <th>Name</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map(cat => (
                          <tr key={cat.id}>
                            <td>
                              <img
                                src={cat.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=50"}
                                alt={cat.name}
                                style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                              />
                            </td>
                            <td><strong>{cat.name}</strong></td>
                            <td>{cat.description || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="categories-form-pane card">
                  <h3>Create New Category</h3>
                  <form onSubmit={handleCreateCategory} className="admin-inline-form">
                    <div className="form-group">
                      <label>Category Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Footwear"
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        rows="3"
                        placeholder="Describe the category..."
                        value={catDesc}
                        onChange={(e) => setCatDesc(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Image URL</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={catImage}
                        onChange={(e) => setCatImage(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">Create Category</button>
                  </form>
                </div>
              </div>
            )}

            {/* 4. MARKETPLACE ORDERS */}
            {activeTab === "orders" && (
              <div className="admin-tab-pane">
                <h3>🛒 Global Customer Orders</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>User ID</th>
                        <th>Order Date</th>
                        <th>Final Amount</th>
                        <th>Status</th>
                        <th>Payment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center">No customer orders found in the database.</td>
                        </tr>
                      ) : (
                        orders.map(order => (
                          <tr key={order.id}>
                            <td><code>{order.id.slice(0, 8)}</code></td>
                            <td><code>{order.userId.slice(0, 8)}</code></td>
                            <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                            <td><strong>₹ {order.finalAmount}</strong></td>
                            <td><span className="badge badge-warning">{order.status}</span></td>
                            <td><span className="badge badge-success">{order.paymentStatus}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. SYSTEM SETTINGS */}
            {activeTab === "settings" && (
              <div className="admin-tab-pane category-pane-layout">
                <div className="categories-list-pane">
                  <h3>⚙️ Platform Configuration Settings</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Setting Key</th>
                          <th>Value</th>
                          <th>Group</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settings.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="text-center">No custom parameters saved. Add one on the right!</td>
                          </tr>
                        ) : (
                          settings.map(set => (
                            <tr key={set.key}>
                              <td><code>{set.key}</code></td>
                              <td><strong>{set.value}</strong></td>
                              <td><span className="badge badge-info">{set.group}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="categories-form-pane card">
                  <h3>Save Setting</h3>
                  <form onSubmit={handleSetSetting} className="admin-inline-form">
                    <div className="form-group">
                      <label>Setting Key *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MaintenanceMode"
                        value={setKey}
                        onChange={(e) => setSetKey(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Setting Value *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. false"
                        value={setValue}
                        onChange={(e) => setSetValue(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Settings Group</label>
                      <select value={setGroup} onChange={(e) => setSetGroup(e.target.value)}>
                        <option value="General">General</option>
                        <option value="Payments">Payments</option>
                        <option value="Shipping">Shipping</option>
                        <option value="Security">Security</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary">Save Setting</button>
                  </form>
                </div>
              </div>
            )}

            {/* 6. AUDIT LOGS */}
            {activeTab === "logs" && (
              <div className="admin-tab-pane">
                <h3>📋 System Activity Audit Logs</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>User Email</th>
                        <th>Action</th>
                        <th>Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center">No system audit logs found.</td>
                        </tr>
                      ) : (
                        logs.map(log => (
                          <tr key={log.id}>
                            <td><code>{log.id}</code></td>
                            <td>{log.userEmail || "System"}</td>
                            <td><strong>{log.action}</strong></td>
                            <td>{new Date(log.createdAt).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}

export default Admin;