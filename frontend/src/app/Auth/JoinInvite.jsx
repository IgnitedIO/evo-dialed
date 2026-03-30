// Dependencies
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";

// API Imports
import { joinInvite } from "../../api/auth.js";

// Style Imports
import "./styles.css";

// Functional Component
export default function JoinInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-fill email and code from URL params
    const emailParam = searchParams.get("email");
    const codeParam = searchParams.get("code");

    if (emailParam) {
      setEmail(emailParam);
      setValue("email", emailParam);
    }
    if (codeParam) {
      setCode(codeParam);
      setValue("code", codeParam);
    }
  }, [searchParams, setValue]);

  // Join invite wrapper
  async function onSubmit(data) {
    setError(null);
    setLoading(true);

    try {
      const result = await joinInvite(data.email, data.code, data.password);
      if (result.success) {
        // Redirect to home/dashboard after successful account creation
        window.location.href = "/";
      } else {
        setError(result.error || "Failed to join invitation");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  // Return layout
  return (
    <div className="auth-cont">
      <form onSubmit={handleSubmit(onSubmit)} className="loginForm">
        <div className="logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 97 25"><g transform="translate(0 0.5)"><path d="M 0 24 L 0 0 L 96.025 0 L 96.025 24 Z" fill="transparent"/><path d="M 29.079 1.479 C 27.899 -0.323 24.141 -0.06 22.292 0.148 C 17.014 0.174 12.267 2.801 8.369 6.627 C 5.551 8.004 1.911 8.653 0.077 11.456 C -0.638 13.386 3.847 13.088 5.152 13.386 C 11.022 14.731 16.139 18.318 19.286 23.428 C 20.442 26.287 23.49 17.554 23.761 16.536 C 24.157 15.047 23.757 13.277 24.03 11.665 C 25.959 8.474 28.99 5.433 29.08 1.479 Z M 2.046 11.385 C 2.394 10.232 5.48 8.915 6.743 9.005 C 6.482 9.952 5.848 10.727 5.25 11.538 C 4.698 11.792 2.283 11.951 2.046 11.385 Z M 7.218 11.983 C 7.204 10.855 8.677 9.082 9.488 8.244 C 13.415 7.12 18.932 7.076 20.322 11.526 C 19.842 12.842 16.398 14.733 15.017 15.164 C 13.606 15.027 12.533 13.881 11.1 13.427 C 9.661 12.82 8.594 12.628 7.218 11.983 Z M 21.336 14.959 C 21.394 15.811 20.012 20.366 19.148 19.885 C 18.504 18.948 17.03 18.143 17.085 16.929 C 18.01 16.141 19.14 15.506 20.121 14.751 C 20.535 14.337 21.401 14.073 21.336 14.959 Z M 26.838 2.785 C 26.764 3.744 22.791 11.334 21.838 9.344 C 19.284 5.9 15.208 6.418 11.582 6.146 C 15.546 2.852 21.296 1.124 26.337 1.966 C 26.644 2.101 26.875 2.315 26.838 2.785 Z" fill="rgb(198,97,14)"/><path d="M 33.957 12.409 L 33.957 11.618 C 33.957 5.712 36.093 3.971 43.977 3.971 C 51.86 3.971 53.89 5.712 53.89 11.618 C 53.917 12.277 53.89 12.646 53.89 12.989 L 38.387 12.989 C 38.545 15.81 39.599 16.548 44.108 16.548 C 49.012 16.548 49.619 15.863 49.619 14.281 L 53.89 14.386 C 53.89 18.5 52.229 20.029 44.082 20.029 C 35.934 20.029 33.957 18.288 33.957 12.409 Z M 38.387 10.273 L 49.435 10.273 C 49.329 7.794 48.459 7.056 44.003 7.056 C 39.547 7.056 38.598 7.716 38.387 10.273 Z" fill="#202020"/><path d="M 61.3 19.712 C 59.717 16.232 55.842 7.873 54.102 4.288 L 58.979 4.288 L 61.774 10.511 C 62.539 12.251 63.33 14.07 64.016 15.705 L 65.888 15.705 C 66.6 14.07 67.364 12.251 68.129 10.511 L 70.924 4.288 L 75.617 4.288 C 73.851 7.873 70.027 15.968 68.314 19.712 Z" fill="#202020"/><path d="M 75.776 12.409 L 75.776 11.618 C 75.776 5.711 77.78 3.971 85.901 3.971 C 94.022 3.971 96.026 5.711 96.026 11.618 L 96.026 12.409 C 96.026 18.288 94.022 20.029 85.901 20.029 C 77.78 20.029 75.776 18.288 75.776 12.409 Z M 91.649 12.066 L 91.649 11.934 C 91.649 8.612 90.805 7.742 85.901 7.742 C 80.997 7.742 80.179 8.612 80.179 11.934 L 80.179 12.066 C 80.179 15.388 80.997 16.258 85.901 16.258 C 90.805 16.258 91.649 15.388 91.649 12.066 Z" fill="#202020"/></g></svg>
        </div>
        <h1 className="title">Accept Your Invitation</h1>
        <p style={{ color: "#666", marginBottom: "24px", textAlign: "center" }}>
          Create your password to complete your account setup
        </p>

        {error && (
          <div style={{
            color: "#dc3545",
            background: "#f8d7da",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        <label className="label">
          <h3 className="subtitle">Email</h3>
          <input
            {...register("email", { required: true })}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!searchParams.get("email")}
            style={searchParams.get("email") ? {
              backgroundColor: "#f5f5f5",
              cursor: "not-allowed"
            } : {}}
          />
        </label>

        <label className="label">
          <h3 className="subtitle">Invitation Code</h3>
          <input
            {...register("code", { required: true })}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={!!searchParams.get("code")}
            style={searchParams.get("code") ? {
              backgroundColor: "#f5f5f5",
              cursor: "not-allowed"
            } : {}}
          />
        </label>

        <label className="label">
          <h3 className="subtitle">Create Password</h3>
          <input
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters"
              }
            })}
            type="password"
            placeholder="Min. 8 characters"
          />
          {errors.password && (
            <span style={{ color: "#dc3545", fontSize: "13px", marginTop: "4px" }}>
              {errors.password.message}
            </span>
          )}
        </label>

        <button
          className="button"
          type="submit"
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
      <img src="/img/evo_pub_fg.webp" alt="bg" className="bg" />
    </div>
  );
}
