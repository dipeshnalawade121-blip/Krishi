'use client';

import React, { useState, useEffect, useRef } from 'react';

const BACKEND_URL = 'https://api.krishi.site';
const GOOGLE_CLIENT_ID = '660849662071-887qddbcaq013hc3o369oimmbbsf74ov.apps.googleusercontent.com';

const SignUpPage: React.FC = () => {
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startCountdown = (seconds: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
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
        startCountdown(119);
        setOtpSectionActive(true);
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP: ' + (error as Error).message);
      alert('Error sending OTP: ' + (error as Error).message);
      hideLoader();
    }
  };

  const handleOtpInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtp(value);
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      setVerifyOtpDisabled(false);
    } else {
      setVerifyOtpDisabled(true);
    }
  };

  const handleVerifyOtp = async () => {
    const phoneInput = mobile.replace(/[^0-9]/g, '');
    const otpValue = otp;
    if (phoneInput.length !== 10 || otpValue.length !== 6) {
      alert('Please enter valid phone and OTP.');
      return;
    }

    try {
      showLoader();
      const response = await fetch(`${BACKEND_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput, otp: otpValue }),
      });
      const data = await response.json();
      hideLoader();

      if (response.ok && data.success) {
        setVerified(true);
        setOtp('');
        setVerifyOtpDisabled(true);
        setSubmitDisabled(false);
      } else {
        throw new Error(data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP: ' + (error as Error).message);
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
    const pw = password;
    if (pw.length < 6) {
      alert('Passwords must be at least 6 characters.');
      return;
    }

    const mobileClean = mobile.replace(/[^0-9]/g, '');
    try {
      showLoader();
      const response = await fetch(`${BACKEND_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobileClean, password: pw }),
      });
      const data = await response.json();
      hideLoader();

      if (response.ok && data.success) {
        alert('Account created successfully! Welcome to Krishi.');
        window.location.href = `https://www.krishi.site/user-profile?mobile=${mobileClean}&id=${data.user.id}`;
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error during registration: ' + (error as Error).message);
      alert('Error during registration: ' + (error as Error).message);
      hideLoader();
    }
  };

  // Google Auth
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (typeof window !== 'undefined' && window.google && window.google.accounts && window.google.accounts.id) {
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
      }
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

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
        const isProfileComplete =
          user.user_name &&
          user.shop_name &&
          user.shop_address &&
          user.user_name.trim() !== '' &&
          user.shop_name.trim() !== '' &&
          user.shop_address.trim() !== '';

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

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Scoped Page Wrapper for Body-Like Styles */}
      <div className="signup-page-wrapper min-h-screen flex items-center justify-center p-5 bg-[#0E0E0E] text-white overflow-x-hidden font-['Inter','Noto_Sans_Devanagari',sans-serif] antialiased">
        <style dangerouslySetInnerHTML={{ __html: `
          .signup-page-wrapper {
            font-family: 'Inter', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          @media (max-width: 480px) {
            .signup-page-wrapper { padding: 20px; }
            .signup-card { padding: 32px 24px !important; }
            .signup-title { font-size: 24px !important; }
            .mobile-otp-row { flex-direction: column !important; }
          }
        ` }} />

        {/* Background Effects */}
        <div 
          className="bg-pattern fixed inset-0 opacity-50 pointer-events-none bg-[length:100px_100px]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px)'
          }}
        />
        <div 
          className="sunray-effect fixed inset-0 pointer-events-none z-10"
          style={{
            background: 'radial-gradient(circle at top center, rgba(20, 20, 20, 0.5) 0%, rgba(7, 7, 7, 1) 70%)',
            animation: 'sunrayPulse 10s ease-in-out infinite alternate'
          }}
        />
        <div 
          className="god-rays fixed top-0 left-0 w-[200%] h-[200%] pointer-events-none z-20"
          style={{
            background: 'radial-gradient(ellipse at 0% 0%, rgba(158,248,122,0.2) 0%, rgba(0,158,87,0.1) 30%, transparent 70%), linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.05) 45%, transparent 55%)',
            mixBlendMode: 'overlay' as const,
            animation: 'godRays 15s ease-in-out infinite'
          }}
        />

        {/* Scoped Keyframes */}
        <style jsx>{`
          @keyframes sunrayPulse {
            0%, 100% { opacity: 0.95; }
            50% { opacity: 0.85; }
          }
          @keyframes godRays {
            0% { transform: translate(-30%, -30%) rotate(0deg); opacity: 0.4; }
            25% { transform: translate(-25%, -25%) rotate(5deg); opacity: 0.6; }
            50% { transform: translate(-30%, -30%) rotate(10deg); opacity: 0.4; }
            75% { transform: translate(-25%, -25%) rotate(5deg); opacity: 0.6; }
            100% { transform: translate(-30%, -30%) rotate(0deg); opacity: 0.4; }
          }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .g_id_signin { border-radius: 12px !important; box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1) !important; transition: transform 0.3s ease, box-shadow 0.3s ease; }
          .g_id_signin:hover { transform: scale(1.02); box-shadow: 0 6px 20px rgba(255, 255, 255, 0.15) !important; }
          .animate-in { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; }
          .delay-100 { animation-delay: 0.1s; }
          .delay-200 { animation-delay: 0.2s; }
          .delay-300 { animation-delay: 0.3s; }
          .delay-400 { animation-delay: 0.4s; }
          .delay-500 { animation-delay: 0.5s; }
        `}</style>

        <div className="signup-container relative z-30 w-full max-w-[480px] mx-auto">
          {/* Top Link */}
          <div className="text-center mb-6 animate-in">
            <a 
              href="https://www.krishi.site/login" 
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200 no-underline"
            >
              Already have an account? <span className="font-semibold">Sign in</span> →
            </a>
          </div>

          <div className="signup-card bg-gradient-to-br from-[#101114] to-[#08090C] rounded-[24px] border border-white/5 p-[40px_32px] relative overflow-hidden mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)] animate-in delay-100">
            <div className="signup-content relative z-[2]">
              {/* Logo */}
              <div className="logo flex items-center justify-center mb-4 gap-[10px]">
                <div className="logo-icon flex items-center justify-center">
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
                <span className="logo-text text-[28px] font-black bg-gradient-to-br from-[#9ef87a] to-[#009e57] bg-clip-text text-transparent leading-[1]">krishi</span>
              </div>

              {/* Title */}
              <h1 className="signup-title text-center text-[28px] font-bold text-white mb-2 leading-[1.2]">Create your free account</h1>
              <p className="signup-subtitle text-center text-base text-[#94a3b8] mb-8">Explore Krishi&apos;s core features for farmers and agri-businesses</p>

              {/* Google Sign-in */}
              <div className="google-btn-container my-6 flex justify-center">
                <div id="google-register-btn" />
              </div>

              {/* Or Divider */}
              <div className="divider flex items-center my-8 gap-4">
                <div className="divider-line flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#334155] to-transparent" />
                <span className="divider-text text-sm text-[#64748b]">or</span>
                <div className="divider-line flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#334155] to-transparent" />
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="animate-in delay-200">
                {/* Mobile Number & OTP Send */}
                <div className="form-group mb-6">
                  <label htmlFor="reg-mobile" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">
                    Mobile Number
                  </label>
                  <div className="mobile-otp-row flex gap-3">
                    <input
                      type="tel"
                      id="reg-mobile"
                      className="input-field flex-1 w-full bg-[#0D1117] backdrop-blur-[10px] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b]"
                      placeholder="Enter your mobile number"
                      maxLength={10}
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                    <button
                      type="button"
                      id="reg-send-otp"
                      className={`otp-button whitespace-nowrap px-5 py-4 text-sm font-semibold text-white transition-all duration-300 rounded-[12px] border border-white/10 backdrop-blur-[10px] ${
                        sendOtpDisabled 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'bg-slate-800/60 hover:bg-slate-800/80 hover:border-[#9ef87a]/30'
                      } ${
                        countdown > 0 ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : ''
                      }`}
                      disabled={sendOtpDisabled}
                      onClick={handleSendOtp}
                    >
                      {countdown > 0 ? `OTP sent! ${formatTime(countdown)}` : 'Get OTP'}
                    </button>
                  </div>
                </div>
                
                {/* OTP Input & Verify */}
                <div id="otp-section" className={`otp-section form-group mb-6 ${otpSectionActive ? 'block animate-[fadeIn_0.5s_ease-out]' : 'hidden'}`}>
                  <label htmlFor="reg-otp" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">
                    Enter OTP
                  </label>
                  <div className="mobile-otp-row flex gap-3">
                    <input
                      type="number"
                      id="reg-otp"
                      className="input-field flex-1 w-full bg-[#0D1117] backdrop-blur-[10px] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b] disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      disabled={!otpSectionActive || verified}
                      value={otp}
                      onChange={handleOtpInput}
                    />
                    <button
                      type="button"
                      id="reg-verify-btn"
                      className={`otp-button whitespace-nowrap px-5 py-4 text-sm font-semibold text-white transition-all duration-300 rounded-[12px] border border-white/10 backdrop-blur-[10px] ${
                        verifyOtpDisabled || verified
                          ? 'opacity-50 cursor-not-allowed'
                          : 'bg-slate-800/60 hover:bg-slate-800/80 hover:border-[#9ef87a]/30'
                      } ${
                        verified ? 'bg-green-500/20 border-green-500/50 text-green-400' : ''
                      }`}
                      disabled={verifyOtpDisabled || verified}
                      onClick={handleVerifyOtp}
                    >
                      {verified ? 'Verified ✓' : 'Verify OTP'}
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className="form-group mb-6">
                  <label htmlFor="reg-password" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="reg-password"
                    className="input-field w-full bg-[#0D1117] backdrop-blur-[10px] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b]"
                    placeholder="Create a secure password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="helper-text text-sm text-[#94a3b8] mt-2">Password should be at least 6 characters</p>
                </div>
                
                {/* Create Account Button */}
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
              <div className="links text-center mt-6 animate-in delay-300">
                <p className="link-text text-sm text-[#94a3b8] mb-2">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors duration-200 no-underline font-medium">Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors duration-200 no-underline font-medium">Privacy Policy</a>.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="footer-links flex justify-center gap-6 mt-8 animate-in delay-400">
            <a href="#" className="footer-link text-xs text-[#64748b] no-underline hover:text-[#94a3b8] transition-colors duration-200">Terms</a>
            <a href="#" className="footer-link text-xs text-[#64748b] no-underline hover:text-[#94a3b8] transition-colors duration-200">Privacy</a>
            <a href="#" className="footer-link text-xs text-[#64748b] no-underline hover:text-[#94a3b8] transition-colors duration-200">Security</a>
          </div>
        </div>
      </div>

      {/* Loader Overlay */}
      {loading && (
        <div
          id="loader-overlay"
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999]"
        >
          <span 
            className="loader w-12 h-12 rounded-full inline-block border-t-[3px] border-r-3 border-r-transparent border-[#34d399] box-border"
            style={{ animation: 'rotation 1s linear infinite' }}
          />
        </div>
      )}

      {/* Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;700;800;900&display=swap"
        rel="stylesheet"
      />
    </>
  );
};

export default SignUpPage;
