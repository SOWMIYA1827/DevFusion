import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authService } from "../services/api";
import "./Login.css"; // Reuse NexShop login aesthetics

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setErrorMsg("Invalid password reset request. No reset token was found in the link.");
      return;
    }

    if (!password) {
      setErrorMsg("Password is required.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await authService.resetPassword(token, password);
      if (res.success) {
        setSuccessMsg(res.message || "Your password has been reset successfully!");
        setPassword("");
        setConfirmPassword("");
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setErrorMsg(res.message || "Failed to reset password. The link may have expired.");
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || 
        "An error occurred. The reset link might be invalid or has already been used."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">NexShop</h1>
        <p className="login-subtitle">Reset Password</p>

        {errorMsg && <div className="auth-alert alert-error">{errorMsg}</div>}
        {successMsg && (
          <div className="auth-alert alert-success">
            {successMsg}
            <p style={{ fontSize: "0.85rem", marginTop: "8px", opacity: 0.9 }}>
              Redirecting you to the login screen in a few seconds...
            </p>
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="login-label">New Password</label>
              <input
                className="login-input"
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="login-label">Confirm New Password</label>
              <input
                className="login-input"
                type="password"
                required
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="login-button btn-primary">
              {loading ? "Resetting password..." : "Set New Password"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button 
            onClick={() => navigate("/login")} 
            className="back-to-login"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
