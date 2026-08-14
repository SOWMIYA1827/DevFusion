import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api";
import "./Login.css";

function Login({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState("login"); // 'login' or 'register' or 'forgot'
  
  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Registration State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("customer");
  
  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState("email"); // 'email' or 'password'
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");

  // OAuth Simulator State
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [oauthProvider, setOauthProvider] = useState("google"); // 'google' or 'github'
  const [oauthEmail, setOauthEmail] = useState("");
  const [oauthName, setOauthName] = useState("");
  const [oauthRole, setOauthRole] = useState("customer");
  const [isOAuthSignup, setIsOAuthSignup] = useState(false);
  const [oauthPassword, setOauthPassword] = useState("");

  const resetForgotState = () => {
    setForgotEmail("");
    setForgotStep("email");
    setForgotPassword("");
    setForgotConfirmPassword("");
    setErrorMsg("");
    setSuccessMsg("");
  };
  
  // Status feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMsg("Please enter email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await authService.login(loginEmail, loginPassword);
      if (response.success && response.data) {
        setSuccessMsg("Logged in successfully!");
        onLoginSuccess();
        const role = response.data.user.role.toLowerCase();
        
        // Redirect to dashboard based on role
        if (role === "admin") {
          navigate("/admin");
        } else if (role === "seller") {
          navigate("/seller");
        } else if (role === "delivery_partner") {
          navigate("/delivery");
        } else {
          navigate("/user");
        }
      } else {
        setErrorMsg(response.message || "Invalid Email or Password");
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || 
        "Failed to connect. Please check credentials or ensure API is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setErrorMsg("Name, email, and password are required.");
      return;
    }

    if (regPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await authService.register(
        regName,
        regEmail,
        regPassword,
        regRole,
        regPhone
      );
      if (response.success) {
        setSuccessMsg("Registration successful! Check your email to verify your account.");
        // Clear inputs
        setRegName("");
        setRegEmail("");
        setRegPhone("");
        setRegPassword("");
        // Switch tab
        setTimeout(() => {
          setActiveTab("login");
          setErrorMsg("");
          setSuccessMsg("");
        }, 3000);
      } else {
        setErrorMsg(response.message || "Registration failed.");
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        const validationErrors = Object.values(err.response.data.errors).flat().join(" ");
        setErrorMsg(validationErrors);
      } else {
        setErrorMsg(err.response?.data?.message || "An error occurred during registration.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();

    if (forgotStep === "email") {
      if (!forgotEmail) {
        setErrorMsg("Please provide your email address.");
        return;
      }

      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      try {
        const response = await authService.verifyEmailExists(forgotEmail);
        if (response.success) {
          setForgotStep("password");
          setSuccessMsg("Email verified! Please enter your new password.");
        } else {
          setErrorMsg(response.message || "No account was found with this email address.");
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.message || "No account was found with this email address.");
      } finally {
        setLoading(false);
      }
    } else if (forgotStep === "password") {
      if (!forgotPassword) {
        setErrorMsg("Password is required.");
        return;
      }

      if (forgotPassword.length < 8) {
        setErrorMsg("Password must be at least 8 characters long.");
        return;
      }

      if (forgotPassword !== forgotConfirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }

      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      try {
        const response = await authService.resetPasswordDirect(forgotEmail, forgotPassword);
        if (response.success && response.data) {
          setSuccessMsg("Password reset successfully! Logging you in...");
          onLoginSuccess();
          const role = response.data.user.role.toLowerCase();
          
          // Redirect to dashboard based on role
          setTimeout(() => {
            if (role === "admin") {
              navigate("/admin");
            } else if (role === "seller") {
              navigate("/seller");
            } else if (role === "delivery_partner") {
              navigate("/delivery");
            } else {
              navigate("/user");
            }
          }, 1500);
        } else {
          setErrorMsg(response.message || "Failed to reset password.");
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.message || "Failed to reset password. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOAuthClick = (provider, isSignup = false) => {
    setOauthProvider(provider);
    setIsOAuthSignup(isSignup);
    if (provider === "google") {
      setOauthEmail("google_user@test.com");
      setOauthName("Google User");
    } else {
      setOauthEmail("github_user@test.com");
      setOauthName("GitHub User");
    }
    setOauthPassword("");
    setOauthRole("customer");
    setShowOAuthModal(true);
  };

  const handleOAuthSubmit = async (e) => {
    e.preventDefault();
    if (!oauthEmail || !oauthName || !oauthPassword) {
      alert("⚠️ Email, Profile Name, and Password are required.");
      return;
    }

    if (oauthPassword.length < 4) {
      alert("⚠️ Password must be at least 4 characters.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setShowOAuthModal(false);

    try {
      const mockProviderId = oauthProvider + "_" + Math.random().toString(36).substring(2, 10);
      const response = await authService.oauthLogin(
        oauthEmail,
        oauthName,
        oauthProvider,
        mockProviderId,
        isOAuthSignup ? oauthRole : undefined
      );

      if (response.success && response.data) {
        setSuccessMsg(`${oauthProvider === "google" ? "Google" : "GitHub"} authorization successful!`);
        onLoginSuccess();
        const role = response.data.user.role.toLowerCase();

        if (role === "admin") {
          navigate("/admin");
        } else if (role === "seller") {
          navigate("/seller");
        } else if (role === "delivery_partner") {
          navigate("/delivery");
        } else {
          navigate("/user");
        }
      } else {
        setErrorMsg(response.message || "OAuth login failed.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "An error occurred during OAuth login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">NexShop</h1>
        <p className="login-subtitle">Multi-Vendor Marketplace</p>

        {errorMsg && (
          <div className="auth-alert alert-error">
            <span>{errorMsg}</span>
            {errorMsg.includes("verify your email") && (
              <button
                type="button"
                className="resend-verification-btn"
                onClick={async () => {
                  setLoading(true);
                  setErrorMsg("");
                  setSuccessMsg("");
                  try {
                    const response = await authService.resendVerification(loginEmail);
                    if (response.success) {
                      setSuccessMsg("Verification email has been resent! Please check your inbox.");
                    } else {
                      setErrorMsg(response.message || "Failed to resend verification email.");
                    }
                  } catch (err) {
                    setErrorMsg(err.response?.data?.message || "An error occurred. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                style={{
                  display: "block",
                  marginTop: "8px",
                  background: "none",
                  border: "none",
                  color: "#d32f2f",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontWeight: "bold",
                  padding: 0
                }}
              >
                {loading ? "Resending..." : "Resend Verification Email"}
              </button>
            )}
          </div>
        )}
        {successMsg && <div className="auth-alert alert-success">{successMsg}</div>}

        {activeTab !== "forgot" && (
          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("login");
                resetForgotState();
              }}
            >
              Log In
            </button>
            <button
              className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("register");
                resetForgotState();
              }}
            >
              Sign Up
            </button>
          </div>
        )}

        {activeTab === "login" && (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label className="login-label">Email Address</label>
              <input
                className="login-input"
                type="email"
                required
                placeholder="email@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="login-label">Password</label>
              <input
                className="login-input"
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <div className="forgot-pwd-link-container">
              <button
                type="button"
                className="forgot-link"
                onClick={() => {
                  resetForgotState();
                  setActiveTab("forgot");
                }}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" disabled={loading} className="login-button btn-primary">
              {loading ? "Logging in..." : "Log In"}
            </button>

            <div className="oauth-divider">
              <span>or continue with</span>
            </div>

            <div className="oauth-buttons-row">
              <button
                type="button"
                className="oauth-btn oauth-google-btn"
                onClick={() => handleOAuthClick("google", false)}
              >
                <span className="oauth-icon">🌐</span> Google
              </button>
              <button
                type="button"
                className="oauth-btn oauth-github-btn"
                onClick={() => handleOAuthClick("github", false)}
              >
                <span className="oauth-icon">🐙</span> GitHub
              </button>
            </div>
          </form>
        )}

        {activeTab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="login-form">
            <div className="form-group">
              <label className="login-label">Full Name</label>
              <input
                className="login-input"
                type="text"
                required
                placeholder="John Doe"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="login-label">Email Address</label>
              <input
                className="login-input"
                type="email"
                required
                placeholder="john@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="login-label">Phone Number (Optional)</label>
              <input
                className="login-input"
                type="text"
                placeholder="+1234567890"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="login-label">Password (Min 8 chars)</label>
              <input
                className="login-input"
                type="password"
                required
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="login-label">Select Account Type</label>
              <select
                className="login-input"
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
              >
                <option value="customer">Customer (Buy Products)</option>
                <option value="seller">Seller (Manage Store & Sell)</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="login-button btn-primary">
              {loading ? "Registering..." : "Create Account"}
            </button>

            <div className="oauth-divider">
              <span>or register with</span>
            </div>

            <div className="oauth-buttons-row">
              <button
                type="button"
                className="oauth-btn oauth-google-btn"
                onClick={() => handleOAuthClick("google", true)}
              >
                <span className="oauth-icon">🌐</span> Google
              </button>
              <button
                type="button"
                className="oauth-btn oauth-github-btn"
                onClick={() => handleOAuthClick("github", true)}
              >
                <span className="oauth-icon">🐙</span> GitHub
              </button>
            </div>
          </form>
        )}

        {activeTab === "forgot" && (
          <form onSubmit={handleForgotSubmit} className="login-form">
            <h3 className="forgot-title">Reset Password</h3>
            
            {forgotStep === "email" ? (
              <>
                <p className="forgot-subtitle">
                  Provide your email address to recover your account.
                </p>

                <div className="form-group">
                  <label className="login-label">Email Address</label>
                  <input
                    className="login-input"
                    type="email"
                    required
                    placeholder="your-email@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>

                <button type="submit" disabled={loading} className="login-button btn-primary">
                  {loading ? "Verifying..." : "Verify Email"}
                </button>
              </>
            ) : (
              <>
                <p className="forgot-subtitle">
                  Enter your new password to reset it and log in.
                </p>

                <div className="form-group">
                  <label className="login-label">New Password</label>
                  <input
                    className="login-input"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={forgotPassword}
                    onChange={(e) => setForgotPassword(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="login-label">Confirm New Password</label>
                  <input
                    className="login-input"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  />
                </div>

                <button type="submit" disabled={loading} className="login-button btn-primary">
                  {loading ? "Resetting & logging in..." : "Set New Password & Log In"}
                </button>
              </>
            )}

            <button
              type="button"
              className="back-to-login"
              onClick={() => {
                setActiveTab("login");
                resetForgotState();
              }}
            >
              Back to Login
            </button>
          </form>
        )}
        
        <div className="auth-footer">
          <button className="guest-browse-btn" onClick={() => navigate("/user")}>
            Browse as Guest &rarr;
          </button>
        </div>
      </div>

      {/* OAuth Mock Dialog Modal */}
      {showOAuthModal && (
        <div className="oauth-modal-overlay">
          <div className={`oauth-modal-card ${oauthProvider === "google" ? "google-theme" : "github-theme"}`}>
            <div className="oauth-modal-header">
              <h3>
                {oauthProvider === "google" ? "🌐 Google Accounts" : "🐙 GitHub Authorization"}
              </h3>
              <button className="oauth-modal-close" onClick={() => setShowOAuthModal(false)}>
                &times;
              </button>
            </div>

            <div className="oauth-logo-container">
              {oauthProvider === "google" ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
              )}
            </div>

            <p className="oauth-modal-info" style={{ textAlign: "center" }}>
              NexShop is requesting mock authorization to login via your <b>{oauthProvider === "google" ? "Google Account" : "GitHub Profile"}</b>.
            </p>

            <form onSubmit={handleOAuthSubmit} className="login-form">
              <div className="form-group">
                <label className="login-label">Email Address</label>
                <input
                  type="email"
                  className="login-input"
                  required
                  placeholder="name@email.com"
                  value={oauthEmail}
                  onChange={(e) => setOauthEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="login-label">Email Password</label>
                <input
                  type="password"
                  className="login-input"
                  required
                  placeholder="••••••••"
                  value={oauthPassword}
                  onChange={(e) => setOauthPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="login-label">Profile Display Name</label>
                <input
                  type="text"
                  className="login-input"
                  required
                  placeholder="User Name"
                  value={oauthName}
                  onChange={(e) => setOauthName(e.target.value)}
                />
              </div>

              {isOAuthSignup && (
                <div className="form-group">
                  <label className="login-label">Select Account Type</label>
                  <select
                    className="login-input"
                    value={oauthRole}
                    onChange={(e) => setOauthRole(e.target.value)}
                  >
                    <option value="customer">Customer (Buy Products)</option>
                    <option value="seller">Seller (Manage Store & Sell)</option>
                  </select>
                </div>
              )}

              <button type="submit" className="login-button btn-primary" style={{ marginTop: "1rem" }}>
                Authorize {oauthProvider === "google" ? "Google" : "GitHub"} Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;