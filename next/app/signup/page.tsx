'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/** ==== Config via ENV with sensible fallbacks ==== */
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://api.krishi.site';
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.krishi.site';
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
  '660849662071-887qddbcaq013hc3o369oimmbbsf74ov.apps.googleusercontent.com';

/** Minimal typing for window.google */
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (opts: {
            client_id: string;
            callback: (resp: any) => void;
            ux_mode?: 'popup' | 'redirect';
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options?: Record<string, any>
          ) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

const SignUpPage: React.FC = () => {
  const router = useRouter();

  const [mobile, setMobile] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const [verified, setVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [otpSectionActive, setOtpSectionActive] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);

  const [sendOtpDisabled, setSendOtpDisabled] = useState<boolean>(false);
  const [verifyOtpDisabled, setVerifyOtpDisabled] = useState<boolean>(true);
  const [submitDisabled, setSubmitDisabled] = useState<boolean>(true);

  const [isGoogleReady, setIsGoogleReady] = useState<boolean>(false);

  /** setInterval in browsers returns number, not NodeJS.Timeout */
  const intervalRef = useRef<number | null>(null);
  const googleButtonWidthRef = useRef<number>(400);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const clearTimer = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startCountdown = (seconds: number) => {
    clearTimer();
    setCountdown(seconds);
    setSendOtpDisabled(true);

    intervalRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearTimer();
          setSendOtpDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /** Keep submit button state in sync with verified + password length */
  useEffect(() => {
    setSubmitDisabled(!(verified && password.length >= 6));
  }, [verified, password]);

  /** OTP input validation */
  const handleOtpInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // keep only digits, max 6
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setVerifyOtpDisabled(!(value.length === 6));
  };

  /** Safe JSON parse for fetch responses */
  const safeJson = async (res: Response) => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  const handleSendOtp = async () => {
    const phoneInput = mobile.replace(/[^0-9]/g, '');
    if (phoneInput.length !== 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    // prevent rapid double-clicks before request even fires
    setSendOtpDisabled(true);

    try {
      showLoader();
      const response = await fetch(`${BACKEND_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data: any = await safeJson(response);
      hideLoader();

      if (response.ok && data?.success) {
        startCountdown(119);
        setOtpSectionActive(true);
      } else {
        setSendOtpDisabled(false);
        throw new Error(data?.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Error sending OTP: ' + (error as Error).message);
      hideLoader();
      setSendOtpDisabled(false);
    }
  };

  const handleVerifyOtp = async () => {
    const phoneInput = mobile.replace(/[^0-9]/g, '');
    if (phoneInput.length !== 10 || otp.length !== 6) {
      alert('Please enter valid phone and OTP.');
      return;
    }

    try {
      showLoader();
      const response = await fetch(`${BACKEND_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput, otp }),
      });
      const data: any = await safeJson(response);
      hideLoader();

      if (response.ok && data?.success) {
        setVerified(true);
        setOtp('');
        setVerifyOtpDisabled(true);
      } else {
        throw new Error(data?.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert('Error verifying OTP: ' + (error as Error).message);
      setOtp('');
      setVerifyOtpDisabled(true);
      hideLoader();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified) {
      alert('Please verify your phone number first.');
      return;
    }
    if (password.length < 6) {
      alert('Passwords must be at least 6 characters.');
      return;
    }

    const mobileClean = mobile.replace(/[^0-9]/g, '');
    try {
      showLoader();
      const response = await fetch(`${BACKEND_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobileClean, password }),
      });
      const data: any = await safeJson(response);
      hideLoader();

      if (response.ok && data?.success) {
        alert('Account created successfully! Welcome to Krishi.');
        // Client-side navigation within the same site
        router.push(
          `/user-profile?mobile=${mobileClean}&id=${encodeURIComponent(
            data.user.id
          )}`
        );
      } else {
        throw new Error(data?.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert('Error during registration: ' + (error as Error).message);
      hideLoader();
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    const id_token = response?.credential;
    if (!id_token) {
      alert('Google sign-up failed.');
      return;
    }

    try {
      showLoader();
      const res = await fetch(`${BACKEND_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token }),
      });
      const data: any = await safeJson(res);
      hideLoader();

      if (res.ok && data?.success) {
        const user = data.user;
        const userId = user.id as string;

        const isProfileComplete =
          !!user.user_name?.trim() &&
          !!user.shop_name?.trim() &&
          !!user.shop_address?.trim();

        if (isProfileComplete) {
          router.push(`/dashboard?id=${encodeURIComponent(userId)}`);
        } else {
          router.push(
            `/user-profile?google_id=${encodeURIComponent(
              user.google_id || ''
            )}&id=${encodeURIComponent(userId)}`
          );
        }
      } else {
        alert('Google sign-up failed: ' + (data?.error || 'Unknown'));
      }
    } catch (err) {
      alert('Error: ' + (err as Error).message);
      hideLoader();
    }
  };

  /** Google Auth initialization (robust, idempotent, no reflows) */
  useEffect(() => {
    // Avoid duplicate injections
    if (!document.getElementById('google-gsi')) {
      const script = document.createElement('script');
      script.id = 'google-gsi';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        const init = () => {
          // Guard: SDK available?
          if (!window.google?.accounts?.id) return;

          // Calculate width AFTER the submit button exists
          const refEl = document.getElementById('reg-submit-btn');
          if (refEl) {
            googleButtonWidthRef.current = refEl.offsetWidth;
          }

          // Initialize and render
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            ux_mode: 'popup',
          });

          const container = document.getElementById('google-register-btn');
          if (container) {
            // Clean previous render if any
            container.innerHTML = '';
            window.google.accounts.id.renderButton(container, {
              theme: 'outline',
              text: 'continue_with',
              size: 'large',
              type: 'standard',
              width: googleButtonWidthRef.current,
            });
            setIsGoogleReady(true);
          }
        };

        // Ensure the DOM is fully painted before measuring
        setTimeout(init, 100);
      };

      document.head.appendChild(script);
    } else {
      // Script already present; try to init immediately
      if (window.google?.accounts?.id) {
        const refEl = document.getElementById('reg-submit-btn');
        if (refEl) googleButtonWidthRef.current = refEl.offsetWidth;

        const container = document.getElementById('google-register-btn');
        if (container) {
          container.innerHTML = '';
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            ux_mode: 'popup',
          });
          window.google.accounts.id.renderButton(container, {
            theme: 'outline',
            text: 'continue_with',
            size: 'large',
            type: 'standard',
            width: googleButtonWidthRef.current,
          });
          setIsGoogleReady(true);
        }
      }
    }

    // Cleanup only timers/listeners; keep the GSI script for other pages
    return () => {
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-5 bg-[#0E0E0E] text-white overflow-x-hidden font-['Inter','Noto_Sans_Devanagari',sans-serif] antialiased">
        {/* Subtle background */}
        <div
          className="bg-pattern fixed inset-0 opacity-50 pointer-events-none bg-[length:100px_100px]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px)',
          }}
        />
        <div
          className="sunray-effect fixed inset-0 pointer-events-none z-10 opacity-90"
          style={{
            background:
              'radial-gradient(circle at top center, rgba(20, 20, 20, 0.5) 0%, rgba(7, 7, 7, 1) 70%)',
          }}
        />
        <div
          className="god-rays fixed top-0 left-0 w-[200%] h-[200%] pointer-events-none z-20 opacity-50"
          style={{
            background:
              'radial-gradient(ellipse at 0% 0%, rgba(158,248,122,0.2) 0%, rgba(0,158,87,0.1) 30%, transparent 70%), linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.05) 45%, transparent 55%)',
            mixBlendMode: 'overlay' as const,
          }}
        />

        <div className="signup-container relative z-30 w-full max-w-[480px] mx-auto">
          {/* Top Link */}
          <div className="text-center mb-6">
            <a
              href={`${SITE_URL}/login`}
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200 no-underline"
            >
              Already have an account? <span className="font-semibold">Sign in</span> →
            </a>
          </div>

          <div className="signup-card bg-gradient-to-br from-[#101114] to-[#08090C] rounded-[24px] border border-white/5 p-[40px_32px] relative overflow-hidden mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="signup-content relative z-[2]">
              {/* Logo */}
              <div className="logo flex items-center justify-center mb-4 gap-[10px]">
                <div className="logo-icon flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
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
                </div>
                <span className="logo-text text-[28px] font-black bg-gradient-to-br from-[#9ef87a] to-[#009e57] bg-clip-text text-transparent leading-[1]">
                  krishi
                </span>
              </div>

              {/* Title */}
              <h1 className="signup-title text-center text-[28px] font-bold text-white mb-2 leading-[1.2]">
                Create your free account
              </h1>
              <p className="signup-subtitle text-center text-base text-[#94a3b8] mb-8">
                Explore Krishi&apos;s core features for farmers and agri-businesses
              </p>

              {/* Google Sign-in Container — always in DOM to avoid deadlock; visually hidden until ready */}
              <div className="google-btn-container my-6 flex justify-center">
                <div
                  id="google-register-btn"
                  className={`${isGoogleReady ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                  // Reserve height to prevent layout shift
                  style={{ minHeight: 40 }}
                />
              </div>

              {/* Or Divider - Only show if Google button is ready */}
              {isGoogleReady && (
                <div className="divider flex items-center my-8 gap-4">
                  <div className="divider-line flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#334155] to-transparent" />
                  <span className="divider-text text-sm text-[#64748b]">or</span>
                  <div className="divider-line flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#334155] to-transparent" />
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit}>
                {/* Mobile Number & OTP Send */}
                <div className="form-group mb-6">
                  <label
                    htmlFor="reg-mobile"
                    className="input-label block text-sm font-semibold text-[#94a3b8] mb-2"
                  >
                    Mobile Number
                  </label>
                  <div className="mobile-otp-row flex gap-3">
                    <input
                      type="tel"
                      id="reg-mobile"
                      className="input-field flex-1 w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b]"
                      placeholder="Enter your mobile number"
                      maxLength={10}
                      required
                      value={mobile}
                      onChange={(e) =>
                        setMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))
                      }
                    />
                    <button
                      type="button"
                      id="reg-send-otp"
                      className={`otp-button whitespace-nowrap px-5 py-4 text-sm font-semibold text-white transition-all duration-300 rounded-[12px] border border-white/10 ${
                        sendOtpDisabled
                          ? 'opacity-50 cursor-not-allowed'
                          : 'bg-slate-800/60 hover:bg-slate-800/80 hover:border-[#9ef87a]/30'
                      } ${countdown > 0 ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : ''}`}
                      disabled={sendOtpDisabled}
                      onClick={handleSendOtp}
                    >
                      {countdown > 0 ? `OTP sent! ${formatTime(countdown)}` : 'Get OTP'}
                    </button>
                  </div>
                </div>

                {/* OTP Input & Verify */}
                <div
                  id="otp-section"
                  className={`otp-section form-group mb-6 ${otpSectionActive ? 'block' : 'hidden'}`}
                >
                  <label
                    htmlFor="reg-otp"
                    className="input-label block text-sm font-semibold text-[#94a3b8] mb-2"
                  >
                    Enter OTP
                  </label>
                  <div className="mobile-otp-row flex gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      id="reg-otp"
                      className="input-field flex-1 w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b] disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      disabled={!otpSectionActive || verified}
                      value={otp}
                      onChange={handleOtpInput}
                    />
                    <button
                      type="button"
                      id="reg-verify-btn"
                      className={`otp-button whitespace-nowrap px-5 py-4 text-sm font-semibold text-white transition-all duration-300 rounded-[12px] border border-white/10 ${
                        verifyOtpDisabled || verified
                          ? 'opacity-50 cursor-not-allowed'
                          : 'bg-slate-800/60 hover:bg-slate-800/80 hover:border-[#9ef87a]/30'
                      } ${verified ? 'bg-green-500/20 border-green-500/50 text-green-400' : ''}`}
                      disabled={verifyOtpDisabled || verified}
                      onClick={handleVerifyOtp}
                    >
                      {verified ? 'Verified ✓' : 'Verify OTP'}
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className="form-group mb-6">
                  <label
                    htmlFor="reg-password"
                    className="input-label block text-sm font-semibold text-[#94a3b8] mb-2"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="reg-password"
                    className="input-field w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b]"
                    placeholder="Create a secure password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="helper-text text-sm text-[#94a3b8] mt-2">
                    Password should be at least 6 characters
                  </p>
                </div>

                {/* Create Account Button (width reference for GSI) */}
                <button
                  type="submit"
                  className={`create-account-button w-full bg-gradient-to-br from-[#9ef87a] to-[#009e57] text-white border-none rounded-[12px] px-4 py-4 text-base font-semibold transition-all duration-300 shadow-[0_4px_15px_rgba(0,158,87,0.4)] mt-2 ${
                    submitDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:from-[#aefc90] hover:to-[#00b066] hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(0,158,87,0.6)] active:translate-y-0'
                  }`}
                  id="reg-submit-btn"
                  disabled={submitDisabled}
                >
                  Create account →
                </button>
              </form>

              {/* Links */}
              <div className="links text-center mt-6">
                <p className="link-text text-sm text-[#94a3b8] mb-2">
                  By creating an account, you agree to our{' '}
                  <a
                    href={`${SITE_URL}/terms`}
                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200 no-underline font-medium"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href={`${SITE_URL}/privacy`}
                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200 no-underline font-medium"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="footer-links flex justify-center gap-6 mt-8">
            <a
              href={`${SITE_URL}/terms`}
              className="footer-link text-xs text-[#64748b] no-underline hover:text-[#94a3b8] transition-colors duration-200"
            >
              Terms
            </a>
            <a
              href={`${SITE_URL}/privacy`}
              className="footer-link text-xs text-[#64748b] no-underline hover:text-[#94a3b8] transition-colors duration-200"
            >
              Privacy
            </a>
            <a
              href={`${SITE_URL}/security`}
              className="footer-link text-xs text-[#64748b] no-underline hover:text-[#94a3b8] transition-colors duration-200"
            >
              Security
            </a>
          </div>
        </div>
      </div>

      {/* Loader Overlay */}
      {loading && (
        <div
          id="loader-overlay"
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999]"
        >
          <span className="loader w-12 h-12 rounded-full inline-block border-t-[3px] border-r-[3px] border-r-transparent border-[#34d399] box-border animate-spin" />
        </div>
      )}

      {/* Small CSS for hover feel; no @import to avoid CSP issues */}
      <style jsx>{`
        .g_id_signin {
          border-radius: 12px !important;
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1) !important;
          transition: transform 0.3s ease, box-shadow 0.3s ease !important;
        }
        .g_id_signin:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.15) !important;
        }
        @media (max-width: 480px) {
          .signup-card {
            padding: 32px 24px !important;
          }
          .signup-title {
            font-size: 24px !important;
          }
        }
      `}</style>
    </>
  );
};

export default SignUpPage;
