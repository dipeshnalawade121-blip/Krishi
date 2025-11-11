'use client';

import React, { useState, useEffect, useRef } from 'react';

const BACKEND_URL = 'https://api.krishi.site';
const GOOGLE_CLIENT_ID = '660849662071-887qddbcaq013hc3o369oimmbbsf74ov.apps.googleusercontent.com';

const SignInPage: React.FC = () => {
  const [mobile, setMobile] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isGoogleButtonReady, setIsGoogleButtonReady] = useState<boolean>(false);
  
  const googleButtonContainerRef = useRef<HTMLDivElement>(null);
  const googleButtonWidthRef = useRef<number>(400);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mobileClean = mobile.replace(/[^0-9]/g, '');
    const pw = password;
    
    if (mobileClean.length !== 10 || pw.length < 6) {
      console.error('Validation Error: Please enter a valid 10-digit mobile number and password (at least 6 characters).');
      return;
    }

    try {
      showLoader();
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobileClean, password: pw }),
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        const userId = data.user.id;
        localStorage.setItem('userMobile', mobileClean);
        
        // Fetch user profile to check completion
        try {
          const profileResponse = await fetch(`${BACKEND_URL}/get-user-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: mobileClean }),
          });
          const profileData = await profileResponse.json();
          
          if (profileResponse.ok && profileData.success) {
            const userProfile = profileData.user;
            const isProfileComplete = userProfile.user_name && userProfile.user_name.trim() !== '' &&
                                    userProfile.shop_name && userProfile.shop_name.trim() !== '' &&
                                    userProfile.shop_address && userProfile.shop_address.trim() !== '';
            
            if (isProfileComplete) {
              window.location.href = `https://www.krishi.site/dashboard?id=${userId}`;
            } else {
              window.location.href = `https://www.krishi.site/user-profile?mobile=${mobileClean}&id=${userId}`;
            }
          } else {
            console.error('Profile fetch error:', profileData.message || 'Unknown error');
            window.location.href = `https://www.krishi.site/user-profile?mobile=${mobileClean}&id=${userId}`;
          }
        } catch (profileError) {
          console.error('Profile check error:', profileError);
          window.location.href = `https://www.krishi.site/user-profile?mobile=${mobileClean}&id=${userId}`;
        }
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Error during login: ' + (error as Error).message);
      hideLoader();
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    const id_token = response.credential;
    if (!id_token) {
      console.error('Google login failed: No token received.');
      return;
    }

    try {
      showLoader();
      const res = await fetch(`${BACKEND_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const user = data.user;
        if (user.email) localStorage.setItem('userEmail', user.email);
        if (user.google_id) localStorage.setItem('userGoogleId', user.google_id);

        const userId = user.id;
        const isProfileComplete = user.user_name && user.shop_name && user.shop_address
                                && user.user_name.trim() !== '' && user.shop_name.trim() !== '' && user.shop_address.trim() !== '';

        if (isProfileComplete) {
          window.location.href = `https://www.krishi.site/dashboard?id=${userId}`;
        } else {
          window.location.href = `https://www.krishi.site/user-profile?google_id=${encodeURIComponent(user.google_id || '')}&id=${userId}`;
        }
      } else {
        console.error('Google login failed: ' + (data.error || 'Unknown error'));
        hideLoader();
      }
    } catch (err) {
      console.error('Error in Google authentication: ' + (err as Error).message);
      hideLoader();
    }
  };

  // Google Auth - Fix for CLS
  useEffect(() => {
    const initializeGoogleButton = () => {
      // Use runtime check to ensure google is available, bypassing TypeScript conflicts.
      if (!(window as any).google?.accounts?.id) {
        setTimeout(initializeGoogleButton, 100);
        return;
      }

      // Pre-calculate width BEFORE initializing Google button
      const loginButton = document.getElementById('login-btn');
      if (loginButton) {
        googleButtonWidthRef.current = loginButton.offsetWidth;
      }

      // Initialize with pre-calculated width
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        ux_mode: 'popup',
      });

      // Render button immediately with correct width
      if (googleButtonContainerRef.current) {
        (window as any).google.accounts.id.renderButton(googleButtonContainerRef.current, {
          theme: 'outline',
          text: 'continue_with',
          size: 'large',
          type: 'standard',
          width: googleButtonWidthRef.current,
        });
        
        // Mark as ready
        setIsGoogleButtonReady(true);
      }
    };

    if (typeof window !== 'undefined') {
      if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogleButton;
        document.head.appendChild(script);
      } else {
        initializeGoogleButton();
      }
    }
  }, []);

  return (
    <>
      {/* Scoped Page Wrapper for Body-Like Styles */}
      <div className="min-h-screen flex items-center justify-center p-5 bg-[#0E0E0E] text-white overflow-x-hidden font-['Inter','Noto_Sans_Devanagari',sans-serif] antialiased">
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;700;800;900&display=swap');
          
          body {
            font-family: 'Inter', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          .g_id_signin { 
            border-radius: 12px !important; 
            box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1) !important; 
            transition: transform 0.3s ease, box-shadow 0.3s ease !important; 
          }
          
          .g_id_signin:hover { 
            transform: scale(1.02); 
            box-shadow: 0 6px 20px rgba(255, 255, 255, 0.15) !important; 
          }

          @keyframes sunrayPulse {
            0%, 100% { opacity: 0.95; }
            50% { opacity: 0.85; }
          }

          @keyframes godRays {
            0% {
              transform: translate(-30%, -30%) rotate(0deg);
              opacity: 0.4;
            }
            25% {
              transform: translate(-25%, -25%) rotate(5deg);
              opacity: 0.6;
            }
            50% {
              transform: translate(-30%, -30%) rotate(10deg);
              opacity: 0.4;
            }
            75% {
              transform: translate(-25%, -25%) rotate(5deg);
              opacity: 0.6;
            }
            100% {
              transform: translate(-30%, -30%) rotate(0deg);
              opacity: 0.4;
            }
          }

          @keyframes rotation { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
          }

          .sunray-effect {
            animation: sunrayPulse 10s ease-in-out infinite alternate;
          }

          .god-rays {
            animation: godRays 15s ease-in-out infinite;
          }

          @media (max-width: 480px) {
            .login-card { padding: 32px 24px !important; }
            .login-title { font-size: 24px !important; }
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
          }}
        />
        <div 
          className="god-rays fixed top-0 left-0 w-[200%] h-[200%] pointer-events-none z-20"
          style={{
            background: 'radial-gradient(ellipse at 0% 0%, rgba(158,248,122,0.2) 0%, rgba(0,158,87,0.1) 30%, transparent 70%), linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.05) 45%, transparent 55%)',
            mixBlendMode: 'overlay' as const,
          }}
        />

        <div className="login-container relative z-30 w-full max-w-[420px] mx-auto">
          <div className="login-card bg-gradient-to-br from-[#101114] to-[#08090C] rounded-[24px] border border-white/5 p-[40px_32px] relative overflow-hidden mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="login-content relative z-[2]">
              {/* Logo */}
              <div className="logo flex items-center justify-center mb-6 gap-[10px]">
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
              <h1 className="login-title text-center text-[28px] font-bold text-white mb-8 leading-[1.2]">Sign in to Krishi</h1>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="mb-6">
                {/* Mobile Number */}
                <div className="form-group mb-6">
                  <label htmlFor="login-mobile" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">
                    मोबाईल नंबर (Mobile Number)
                  </label>
                  <input
                    type="tel"
                    id="login-mobile"
                    className="input-field w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b]"
                    placeholder="Enter your mobile number"
                    maxLength={10}
                    inputMode="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
                
                {/* Password */}
                <div className="form-group mb-6">
                  <label htmlFor="login-password" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">
                    पासवर्ड (Password)
                  </label>
                  <div className="password-container relative">
                    <input
                      type="password"
                      id="login-password"
                      className="input-field w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 pr-20 placeholder:text-[#64748b]"
                      placeholder="Enter your password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <a 
                      href="https://www.krishi.site/forgot-password" 
                      className="forgot-password absolute right-4 top-1/2 -translate-y-1/2 text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 no-underline"
                    >
                      Forgot?
                    </a>
                  </div>
                </div>
                
                {/* Sign In Button */}
                <button
                  type="submit"
                  className="login-button w-full bg-gradient-to-br from-[#9ef87a] to-[#009e57] text-white border-none rounded-[12px] px-4 py-4 text-base font-semibold transition-all duration-300 shadow-[0_4px_15px_rgba(0,158,87,0.4)] hover:from-[#aefc90] hover:to-[#00b066] hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(0,158,87,0.6)] active:translate-y-0"
                  id="login-btn"
                >
                  Sign in
                </button>
              </form>

              {/* Or Divider */}
              <div className="divider flex items-center my-6 gap-4">
                <div className="divider-line flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#334155] to-transparent" />
                <span className="divider-text text-sm text-[#64748b]">or</span>
                <div className="divider-line flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#334155] to-transparent" />
              </div>

              {/* Google Sign-in - FIX: Set height to exactly 50px */}
              <div 
                ref={googleButtonContainerRef}
                className="google-btn-container my-6 flex justify-center transition-opacity duration-300"
                style={{ 
                  opacity: isGoogleButtonReady ? 1 : 0,
                  height: '50px' // <-- THE FINAL CLS FIX: Force exact height
                }}
              />

              {/* Links */}
              <div className="links text-center">
                <p className="link-text text-sm text-[#94a3b8] mb-2">
                  New to Krishi? <a href="https://www.krishi.site/signup" className="link text-blue-400 hover:text-blue-300 transition-colors duration-200 no-underline font-medium">Create an account</a>
                </p>
                <a 
                  href="https://www.krishi.site/otp-login" 
                  className="otp-link block mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 no-underline"
                >
                  Sign in with OTP
                </a>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="footer-links flex justify-center gap-6 mt-8 pt-6 border-t border-white/10">
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
            className="loader w-12 h-12 rounded-full inline-block border-t-[3px] border-r-3 border-r-transparent border-[#34d399] box-border animate-[rotation_1s_linear_infinite]"
          />
        </div>
      )}
    </>
  );
};

export default SignInPage;
