import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authService } from "../services/api";
import "./Login.css"; // Reuse NexShop login aesthetics

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("Verifying your email address. Please wait...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification request. No token was provided.");
      return;
    }

    const verify = async () => {
      try {
        const res = await authService.verifyEmail(token);
        if (res.success) {
          setStatus("success");
          setMessage(res.message || "Your email has been verified successfully!");
          // Auto redirect to login after 4 seconds
          setTimeout(() => {
            navigate("/login");
          }, 4000);
        } else {
          setStatus("error");
          setMessage(res.message || "Email verification failed. The link may be invalid or expired.");
        }
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data?.message || 
          "An error occurred while verifying your email. Please try again later."
        );
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="login-container">
      <div className="login-box" style={{ textAlign: "center", padding: "40px" }}>
        <h1 className="login-title">NexShop</h1>
        <p className="login-subtitle">Email Verification</p>

        <div style={{ margin: "30px 0", fontSize: "1.1rem" }}>
          {status === "verifying" && (
            <div className="verification-loading">
              <span style={{ fontSize: "2rem", display: "block", marginBottom: "15px" }}>⏳</span>
              <p>{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="auth-alert alert-success" style={{ padding: "20px" }}>
              <span style={{ fontSize: "2rem", display: "block", marginBottom: "10px" }}>✅</span>
              <p style={{ fontWeight: "bold", margin: 0 }}>{message}</p>
              <p style={{ fontSize: "0.9rem", marginTop: "10px", opacity: 0.8 }}>
                Redirecting you to the login screen in a few seconds...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="auth-alert alert-error" style={{ padding: "20px" }}>
              <span style={{ fontSize: "2rem", display: "block", marginBottom: "10px" }}>❌</span>
              <p style={{ fontWeight: "bold", margin: 0 }}>{message}</p>
            </div>
          )}
        </div>

        <button 
          onClick={() => navigate("/login")} 
          className="login-button btn-primary"
          style={{ marginTop: "10px" }}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}

export default VerifyEmail;
