import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { authService } from "./services/api";

import Login from "./components/Login";
import User from "./components/User";
import Admin from "./components/Admin";
import SellerPanel from "./components/SellerPanel";
import DeliveryPanel from "./components/DeliveryPanel";
import Favorites from "./components/Favorites";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import OrdersList from "./components/OrdersList";
import Product from "./components/Product";
import VerifyEmail from "./components/VerifyEmail";
import ResetPassword from "./components/ResetPassword";


function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    // Check for logged-in user on load
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  useEffect(() => {
    // Apply theme attribute
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleLoginSuccess = () => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Global Navigation Header */}
        <header className="navbar">
          <Link className="nav-logo" to="/">
            🛒 NexShop
          </Link>
          
          <nav>
            <ul className="nav-links">
              {/* Common view for guest/customers */}
              {(!currentUser || currentUser.role.toLowerCase() === "customer") && (
                <li>
                  <Link className="nav-link" to="/user">
                    🛍 Browse Shop
                  </Link>
                </li>
              )}

              {/* Logged in Customer Navigation */}
              {currentUser && currentUser.role.toLowerCase() === "customer" && (
                <>
                  <li>
                    <Link className="nav-link" to="/user/favorites">
                      ❤️ Wishlist
                    </Link>
                  </li>
                  <li>
                    <Link className="nav-link" to="/user/cart">
                      🛒 Cart
                    </Link>
                  </li>
                  <li>
                    <Link className="nav-link" to="/user/orders">
                      📦 My Orders
                    </Link>
                  </li>
                </>
              )}

              {/* Logged in Seller Navigation */}
              {currentUser && currentUser.role.toLowerCase() === "seller" && (
                <>
                  <li>
                    <Link className="nav-link" to="/seller">
                      🏪 Store Manager
                    </Link>
                  </li>
                  <li>
                    <Link className="nav-link" to="/user">
                      🛍 Shop View
                    </Link>
                  </li>
                </>
              )}

              {/* Logged in Admin Navigation */}
              {currentUser && currentUser.role.toLowerCase() === "admin" && (
                <>
                  <li>
                    <Link className="nav-link" to="/admin">
                      🛡️ Admin Panel
                    </Link>
                  </li>
                  <li>
                    <Link className="nav-link" to="/user">
                      🛍 Shop View
                    </Link>
                  </li>
                </>
              )}

              {/* Logged in Delivery Partner Navigation */}
              {currentUser && currentUser.role.toLowerCase() === "delivery_partner" && (
                <li>
                  <Link className="nav-link" to="/delivery">
                    🚚 Deliveries Workspace
                  </Link>
                </li>
              )}

              {/* Theme Toggle Button */}
              <li>
                <button className="theme-toggle-btn" onClick={toggleTheme} title="Switch theme">
                  {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
                </button>
              </li>

              {/* Auth Button */}
              <li>
                {currentUser ? (
                  <div className="nav-user-indicator">
                    <span className="user-name-badge">Hi, {currentUser.name}</span>
                    <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link className="btn btn-primary btn-sm" to="/login">
                    Sign In
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        </header>

        {/* Routing Pipeline */}
        <main className="main-content-flow">
          <Routes>
            {/* Root redirection based on login status */}
            <Route
              path="/"
              element={
                currentUser ? (
                  currentUser.role.toLowerCase() === "admin" ? (
                    <Navigate to="/admin" replace />
                  ) : currentUser.role.toLowerCase() === "seller" ? (
                    <Navigate to="/seller" replace />
                  ) : currentUser.role.toLowerCase() === "delivery_partner" ? (
                    <Navigate to="/delivery" replace />
                  ) : (
                    <Navigate to="/user" replace />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Login Route */}
            <Route
              path="/login"
              element={
                currentUser ? (
                  <Navigate to="/" replace />
                ) : (
                  <Login onLoginSuccess={handleLoginSuccess} />
                )
              }
            />

            {/* Verify Email & Reset Password Routes */}
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Customer view routes */}
            <Route path="/user/*" element={<User />}>
              <Route index element={<Product />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="orders" element={<OrdersList />} />
            </Route>

            {/* Seller dashboard route */}
            <Route
              path="/seller/*"
              element={
                currentUser && currentUser.role.toLowerCase() === "seller" ? (
                  <SellerPanel />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Admin dashboard route */}
            <Route
              path="/admin/*"
              element={
                currentUser && currentUser.role.toLowerCase() === "admin" ? (
                  <Admin />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Delivery dashboard route */}
            <Route
              path="/delivery/*"
              element={
                currentUser && currentUser.role.toLowerCase() === "delivery_partner" ? (
                  <DeliveryPanel />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;