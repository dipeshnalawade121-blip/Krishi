// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

const BACKEND_URL = "https://api.krishi.site";
const GOOGLE_CLIENT_ID =
  "660849662071-887qddbcaq013hc3o369oimmbbsf74ov.apps.googleusercontent.com";

export default function SignupPage() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSectionActive, setOtpSectionActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendOtpDisabled, setSendOtpDisabled] = useState(false);
  const [verifyOtpDisabled, setVerifyOtpDisabled] = useState(true);
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startCountdown = (seconds: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCountdown(seconds);
    setSendOtpDisabled(true);

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setSendOtpDisabled(false);
          setCountdown(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    const phoneInput = mobile.replace(/[^0-9]/g, "");
    if (phoneInput.length !== 10) return;

    try {
      showLoader();
      const response = await fetch(`${BACKEND_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data = await response.json();
      hideLoader();

      if (response.ok && data.success) {
        startCountdown(119);
        setOtpSectionActive(true);
      }
    } catch (error) {
      hideLoader();
    }
  };

  const handleOtpInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtp(value);
    setVerifyOtpDisabled(!(value.length === 6 && /^\d{6}$/.test(value)));
  };

  const handleVerifyOtp = async () => {
    const phoneInput = mobile.replace(/[^0-9]/g, "");
    if (phoneInput.length !== 10 || otp.length !== 6) return;

    try {
      showLoader();
      const response = await fetch(`${BACKEND_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput, otp }),
      });
      const data = await response.json();
      hideLoader();

      if (response.ok && data.success) {
        setVerified(true);
        setOtp("");
        setVerifyOtpDisabled(true);
        setSubmitDisabled(false);
      }
    } catch {
      hideLoader();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified || password.length < 6) return;

    const mobileClean = mobile.replace(/[^0-9]/g, "");
    try {
      showLoader();
      const response = await fetch(`${BACKEND_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobileClean, password }),
      });
      const data = await response.json();
      hideLoader();

      if (response.ok && data.success) {
        window.location.href = `https://www.krishi.site/user-profile?mobile=${mobileClean}&id=${data.user.id}`;
      }
    } catch {
      hideLoader();
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleGoogleCredentialResponse = async (response: any) => {
    const id_token = response.credential;
    if (!id_token) return;

    try {
      showLoader();
      const res = await fetch(`${BACKEND_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token }),
      });
      const data = await res.json();
      hideLoader();

      if (res.ok && data.success) {
        const user = data.user;
        const userId = user.id;
        const complete =
          user.user_name &&
          user.shop_name &&
          user.shop_address &&
          user.user_name.trim() !== "" &&
          user.shop_name.trim() !== "" &&
          user.shop_address.trim() !== "";

        if (complete)
          window.location.href = `https://www.krishi.site/dashboard?id=${userId}`;
        else
          window.location.href = `https://www.krishi.site/user-profile?google_id=${encodeURIComponent(
            user.google_id || ""
          )}&id=${userId}`;
      }
    } catch {
      hideLoader();
    }
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google?.accounts?.id) {
        const ref = document.getElementById("reg-submit-btn");
        let width = 400;
        if (ref) width = ref.offsetWidth;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          ux_mode: "popup",
        });
        const container = document.getElementById("google-register-btn");
        if (container) {
          window.google.accounts.id.renderButton(container, {
            theme: "outline",
            text: "continue_with",
            size: "large",
            type: "standard",
            width,
          });
        }
      }
    };
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="signup-wrapper" suppressHydrationWarning>
      <div className="signup-card">
        <div className="logo">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#logoGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9ef87a" />
                <stop offset="100%" stopColor="#009e57" />
              </linearGradient>
            </defs>
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
          <span className="logo-text">krishi</span>
        </div>

        <h1>Create your free account</h1>
        <p className="subtitle">
          Explore Krishi&apos;s core features for farmers and agri-businesses
        </p>

        <div id="google-register-btn" className="g-btn" />

        <form onSubmit={handleSubmit}>
          <label>Mobile Number</label>
          <div className="row">
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter mobile number"
              maxLength={10}
              required
            />
            <button type="button" onClick={handleSendOtp} disabled={sendOtpDisabled}>
              {countdown > 0 ? `OTP ${formatTime(countdown)}` : "Get OTP"}
            </button>
          </div>

          {otpSectionActive && (
            <>
              <label>Enter OTP</label>
              <div className="row">
                <input
                  type="number"
                  value={otp}
                  onChange={handleOtpInput}
                  placeholder="6-digit OTP"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifyOtpDisabled || verified}
                >
                  {verified ? "Verified ✓" : "Verify"}
                </button>
              </div>
            </>
          )}

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
          />

          <button id="reg-submit-btn" type="submit" disabled={submitDisabled}>
            Create account →
          </button>
        </form>

        <p className="small">
          Already have an account?{" "}
          <a href="https://www.krishi.site/login">Sign in →</a>
        </p>
      </div>

      {loading && (
        <div className="loader">
          <span />
        </div>
      )}

      <style jsx global>{`
        body {
          background: radial-gradient(
            circle at top center,
            rgba(20, 20, 20, 0.5) 0%,
            rgba(7, 7, 7, 1) 70%
          );
          font-family: "Inter", "Noto Sans Devanagari", sans-serif;
          color: #fff;
          overflow-x: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .signup-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 40px 32px;
          width: 100%;
          max-width: 420px;
          text-align: center;
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .logo {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .logo-text {
          background: linear-gradient(135deg, #9ef87a, #009e57);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 900;
          font-size: 26px;
        }
        h1 {
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .subtitle {
          font-size: 14px;
          color: #94a3b8;
          margin-bottom: 16px;
        }
        form {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 14px;
        }
        input {
          width: 100%;
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #fff;
        }
        button {
          background: linear-gradient(135deg, #9ef87a, #009e57);
          border: none;
          border-radius: 12px;
          padding: 12px;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          transition: 0.3s;
        }
        button:hover {
          transform: translateY(-2px);
        }
        .row {
          display: flex;
          gap: 8px;
        }
        .small {
          margin-top: 16px;
          font-size: 13px;
          color: #94a3b8;
        }
        .small a {
          color: #60a5fa;
        }
        .loader {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
        .loader span {
          width: 48px;
          height: 48px;
          border: 4px solid #34d399;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

