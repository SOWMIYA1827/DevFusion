# 🛒 NexShop — Smart Multi-Vendor E-Commerce & Inventory Management Platform

## 👥 Team & Roles
*   **Sowmiya Murugan** — Lead Developer, Full-Stack Architect & Database Designer

---

## 🎯 Chosen Problem Statement & Scope
**Problem Statement**: Smart Multi-Vendor E-Commerce & Inventory Management System.
In modern retail, coordinating multiple sellers, secure user access, sandbox checkouts, and dispatching logistics requires scalable multi-party workflows. **NexShop** provides an end-to-end e-commerce cycle with dedicated experiences for four distinct user roles.

---

## 📖 Project Description
**NexShop** is a high-fidelity multi-vendor e-commerce marketplace platform that streamlines and connects the lifecycle of retail. The application allows admins to supervise the marketplace, sellers to manage stores and track inventory, customers to search, customize cart selections, make simulated payments, and delivery partners to claim and verify shipments.

---

## 🛠️ Tech Stack
*   **Frontend**: React.js, React Router, CSS3, Axios, JavaScript (ES6)
*   **Backend API**: ASP.NET Core 9.0 Web API, Entity Framework Core (EF Core)
*   **Database**: MySQL (Pomelo EntityFrameworkCore MySql provider)
*   **Authentication & Security**: JWT (JSON Web Tokens), BCrypt password hashing, role-based authorization policies
*   **Third-Party Services**: SMTP (Gmail App Passwords for email verification)

---

## 🔗 Live Deployment Links
*   **Frontend (App URL)**: [https://nexshop-frontend.loca.lt](https://nexshop-frontend.loca.lt)
*   **Backend (API & Swagger Docs)**: [https://soft-comics-poke.loca.lt](https://soft-comics-poke.loca.lt)
*   *Note: For the localtunnel bypass warning page, use Host IP:* **`157.51.62.184`**

---

## ✨ Features Built
### 1. Multi-Party Authentication & Security
*   **Role-Based Dashboards**: Tailored UI and route protections for **Admin**, **Seller**, **Customer**, and **Delivery Partner**.
*   **Security**: Password hashing via BCrypt and session authorization using JWT tokens.
*   **Email Verification**: Auto-sends token-based validation emails upon signup.
*   **Instant Direct Password Recovery**: Direct password reset link that automatically signs the user in on email completion.
*   **OAuth Sandboxes**: Beautiful mock authorization portals for Google and GitHub sign-in/up.

### 2. Customer Panel
*   Browse, search, and filter products by category.
*   Add/remove items to Favorites (Wishlist) and Cart.
*   **Sandbox Payments**: Integrated checkout simulation supporting:
    *   **Stripe Test Mode**: Fully simulated credit card gateway.
    *   **Razorpay Test Mode**: Simulated UPI (VPA) and NetBanking interfaces.
*   Track live order timelines (Pending ➔ Shipped ➔ Out for Delivery ➔ Delivered).

### 3. Seller Dashboard
*   Store Creation wizard.
*   Manage Store Products (CRUD operations, pricing, details).
*   **Inventory & Thresholds**: Monitor stock quantities with automated low-stock warnings.
*   **Coupon Codes**: Create, activate, and deactivate vendor coupons.
*   **Reviews & Feedback**: Review customer reviews and publish official seller replies.

### 4. Admin Management Panel
*   User Directory: View, activate, or disable user accounts.
*   Seller Approvals: Review store requests and verify sellers.
*   Cross-Platform Activity Logs: Audit logins, purchases, and critical actions.

### 5. Delivery Partner Portal
*   Claim dispatched orders.
*   Shipment Route Tracker (simulated tracking maps).
*   **Secure Verification**: OTP-based delivery completion (sends verification SMS/OTP code to complete).

---

## 🚀 Running the Project Locally

### 1. Prerequisites
*   .NET 9.0 SDK
*   Node.js (v18+)
*   MySQL Server (v8.0+)

### 2. Running the Backend API
1. Navigate to the backend directory:
   ```bash
   cd DevFusionAPI/DevFusionAPI
