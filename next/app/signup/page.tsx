'use client';

import { useState, useRef, useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    google: any;
  }
}

const BACKEND_URL = 'https://api.krishi.site';
const GOOGLE_CLIENT_ID = '660849662071-887qddbcaq013hc3o369oimmbbsf74ov.apps.googleusercontent.com';

export default function SignUpPage() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleInitialized, setIsGoogleInitialized] = useState(false);
  
  const countdownRef = useRef<NodeJS.Timeout>();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdownRef.current) {
      clearTimeout(countdownRef.current);
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showLoader = () => setIsSubmitting(true);
  const hideLoader = () => setIsSubmitting(false);

  const handleSendOtp = async () => {
    const phoneInput = mobile.replace(/[^0-9]/g, '');
    if (phoneInput.length !== 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      showLoader();
      const response = await fetch(`${BACKEND_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data = await response.json();
      hideLoader();

      if (response.ok && data.success) {
        setIsOtpSent(true);
        setCountdown(119);
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error(error);
      alert('Error sending OTP: ' + (error as Error).message);
      hideLoader();
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
      const data = await response.json();
      hideLoader();

      if (response.ok && data.success) {
        setIsOtpVerified(true);
        setCountdown(0);
      } else {
        throw new Error(data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error(error);
      alert('Error verifying OTP: ' + (error as Error).message);
      setOtp('');
      hideLoader();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpVerified) {
      alert('Please verify your phone number first.');
      return;
    }

    const phoneInput = mobile.replace(/[^0-9]/g, '');
    if (password.length < 6) {
      alert('Passwords must be at least 6 characters.');
      return;
    }

    try {
      showLoader();
      const response = await fetch(`${BACKEND_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: phoneInput, password }),
      });
      const data = await response.json();
      hideLoader();

      if (response.ok && data.success) {
        alert('Account created successfully! Welcome to Krishi.');
        window.location.href = `https://www.krishi.site/user-profile?mobile=${phoneInput}&id=${data.user.id}`;
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error(error);
      alert('Error during registration: ' + (error as Error).message);
      hideLoader();
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    const id_token = response.credential;
    if (!id_token) return alert('Google sign-up failed.');

    try {
      showLoader();
      const res = await fetch(`${BACKEND_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token }),
      });
      const data = await res.json();
      hideLoader();

      if (res.ok && data.success) {
        const user = data.user;
        const userId = user.id;
        const isProfileComplete = user.user_name && user.shop_name && user.shop_address
          && user.user_name.trim() !== '' && user.shop_name.trim() !== '' && user.shop_address.trim() !== '';

        if (isProfileComplete) {
          window.location.href = `https://www.krishi.site/dashboard?id=${userId}`;
        } else {
          window.location.href = `https://www.krishi.site/user-profile?google_id=${encodeURIComponent(user.google_id || '')}&id=${userId}`;
        }
      } else {
        alert('Google sign-up failed: ' + (data.error || 'Unknown'));
      }
    } catch (err) {
      alert('Error: ' + (err as Error).message);
      hideLoader();
    }
  };

  const initGoogleButton = () => {
    if (!window.google?.accounts?.id) {
      setTimeout(initGoogleButton, 100);
      return;
    }

    const referenceElement = document.getElementById('reg-submit-btn');
    let desiredWidth = 400;

    if (referenceElement) {
      desiredWidth = referenceElement.offsetWidth;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredentialResponse,
      ux_mode: 'popup',
    });

    const registerBtnContainer = document.getElementById('google-register-btn');
    if (registerBtnContainer) {
      window.google.accounts.id.renderButton(registerBtnContainer, {
        theme: 'outline',
        text: 'continue_with',
        size: 'large',
        type: 'standard',
        width: desiredWidth,
      });
    }

    setIsGoogleInitialized(true);
  };

  useEffect(() => {
    if (window.google?.accounts?.id && !isGoogleInitialized) {
      initGoogleButton();
    }
  }, [isGoogleInitialized]);

  const getOtpButtonText = () => {
    if (countdown > 0) {
      return `OTP sent! ${formatTime(countdown)}`;
    }
    return 'Get OTP';
  };

  const getOtpButtonClass = () => {
    let baseClass = 'otp-button rounded-xl px-5 py-4 text-sm font-semibold transition-all duration-300 whitespace-nowrap';
    
    if (isOtpVerified) {
      return `${baseClass} bg-green-500/20 border-green-500/50 text-green-400 cursor-not-allowed`;
    } else if (isOtpSent) {
      return `${baseClass} bg-blue-500/20 border-blue-500/50 text-blue-400`;
    } else {
      return `${baseClass} bg-slate-800/60 border-white/10 text-white hover:bg-slate-800/80 hover:border-green-400/30`;
    }
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="lazyOnload"
        onLoad={initGoogleButton}
      />
      
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-5 relative overflow-hidden font-['Inter','Noto_Sans_Devanagari',sans-serif]">
        {/* Background Pattern */}
        <div 
          className="fixed inset-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px),
              repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px)
            `,
            backgroundSize: '100px 100px',
          }}
        />
        
        {/* Sunray Effect */}
        <div className="fixed inset-0 bg-radial-gradient(circle_at_top_center, rgba(20,20,20,0.5)_0%, rgba(7,7,7,1)_70%) z-10 pointer-events-none animate-pulse" />
        
        {/* God Rays Effect */}
        <div 
          className="fixed top-0 left-0 w-[200%] h-[200%] z-20 pointer-events-none mix-blend-overlay animate-pulse"
          style={{
            background: `
              radial-gradient(ellipse at 0% 0%, rgba(158,248,122,0.2)_0%, rgba(0,158,87,0.1)_30%, transparent_70%),
              linear-gradient(135deg, transparent_0%, rgba(255,255,255,0.05)_45%, transparent_55%)
            `,
          }}
        />

        {/* Loader Overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
            <div className="loader w-12 h-12 border-t-3 border-t-green-400 border-r-3 border-r-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Main Signup Container */}
        <div className="relative z-30 w-full max-w-[480px] mx-auto">
          {/* Top Link */}
          <div className="text-center mb-6 animate-fade-in-up">
            <a 
              href="https://www.krishi.site/login" 
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Already have an account? <span className="font-semibold">Sign in</span> →
            </a>
          </div>

          <div className="bg-gradient-to-br from-[#101114] to-[#08090C] rounded-3xl border border-white/5 p-10 relative overflow-hidden mb-6 shadow-2xl animate-fade-in-up animation-delay-100">
            <div className="relative z-10">
              {/* Logo */}
              <div className="flex items-center justify-center mb-4 gap-2.5">
                <div className="logo-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#logoGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                <span className="logo-text text-3xl font-black bg-gradient-to-r from-[#9ef87a] to-[#009e57] bg-clip-text text-transparent leading-none">
                  krishi
                </span>
              </div>

              {/* Title */}
              <h1 className="signup-title text-2xl font-bold text-white text-center mb-2 leading-tight">
                Create your free account
              </h1>
              <p className="signup-subtitle text-base text-slate-400 text-center mb-8">
                Explore Krishi&apos;s core features for farmers and agri-businesses
              </p>

              {/* Google Sign-in */}
              <div className="google-btn-container my-6 flex justify-center">
                <div id="google-register-btn" ref={googleBtnRef} />
              </div>

              {/* Or Divider */}
              <div className="divider flex items-center my-8 gap-4">
                <div className="divider-line flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                <span className="divider-text text-sm text-slate-500">or</span>
                <div className="divider-line flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="animate-fade-in-up animation-delay-200">
                {/* Mobile Number & OTP Send */}
                <div className="form-group mb-6">
                  <label htmlFor="reg-mobile" className="input-label block text-sm font-semibold text-slate-400 mb-2">
                    Mobile Number
                  </label>
                  <div className="mobile-otp-row flex gap-3">
                    <input
                      type="tel"
                      id="reg-mobile"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="input-field flex-1 bg-[#0D1117] backdrop-blur-sm border border-white/10 rounded-xl px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-green-400/50 focus:ring-2 focus:ring-green-400/20"
                      placeholder="Enter your mobile number"
                      maxLength={10}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isOtpSent && countdown > 0}
                      className={getOtpButtonClass()}
                    >
                      {getOtpButtonText()}
                    </button>
                  </div>
                </div>
                
                {/* OTP Input & Verify */}
                <div className={`otp-section form-group mb-6 transition-all duration-500 ${isOtpSent ? 'block animate-fade-in' : 'hidden'}`}>
                  <label htmlFor="reg-otp" className="input-label block text-sm font-semibold text-slate-400 mb-2">
                    Enter OTP
                  </label>
                  <div className="mobile-otp-row flex gap-3">
                    <input
                      type="number"
                      id="reg-otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="input-field flex-1 bg-[#0D1117] backdrop-blur-sm border border-white/10 rounded-xl px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-green-400/50 focus:ring-2 focus:ring-green-400/20 disabled:opacity-50"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      disabled={isOtpVerified}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otp.length !== 6 || isOtpVerified}
                      className={getOtpButtonClass()}
                    >
                      {isOtpVerified ? 'Verified ✓' : 'Verify OTP'}
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className="form-group mb-6">
                  <label htmlFor="reg-password" className="input-label block text-sm font-semibold text-slate-400 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="reg-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field w-full bg-[#0D1117] backdrop-blur-sm border border-white/10 rounded-xl px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-green-400/50 focus:ring-2 focus:ring-green-400/20"
                    placeholder="Create a secure password"
                    required
                  />
                  <p className="helper-text text-sm text-slate-400 mt-2">
                    Password should be at least 6 characters
                  </p>
                </div>
                
                {/* Create Account Button */}
                <button
                  type="submit"
                  id="reg-submit-btn"
                  disabled={!isOtpVerified}
                  className="create-account-button w-full bg-gradient-to-r from-[#9ef87a] to-[#009e57] text-white border-none rounded-xl py-4 px-4 text-base font-semibold cursor-pointer transition-all duration-300 shadow-lg shadow-green-600/40 hover:shadow-xl hover:shadow-green-600/60 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-green-600/40 mt-2"
                >
                  Create account →
                </button>
              </form>

              {/* Links */}
              <div className="links text-center mt-6 animate-fade-in-up animation-delay-300">
                <p className="link-text text-sm text-slate-400 mb-2">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="link text-blue-400 hover:text-blue-300 transition-colors font-medium">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="link text-blue-400 hover:text-blue-300 transition-colors font-medium">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="footer-links flex justify-center gap-6 mt-8 animate-fade-in-up animation-delay-400">
            <a href="#" className="footer-link text-xs text-slate-500 hover:text-slate-400 transition-colors">
              Terms
            </a>
            <a href="#" className="footer-link text-xs text-slate-500 hover:text-slate-400 transition-colors">
              Privacy
            </a>
            <a href="#" className="footer-link text-xs text-slate-500 hover:text-slate-400 transition-colors">
              Security
            </a>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;700;800;900&display=swap');
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animation-delay-100 { animation-delay: 0.1s; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        /* Ensure Google button styles */
        .g_id_signin {
          border-radius: 12px !important;
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1) !important;
          transition: transform 0.3s ease, box-shadow 0.3s ease !important;
        }
        
        .g_id_signin:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.15) !important;
        }
      `}</style>
    </>
  );
}
