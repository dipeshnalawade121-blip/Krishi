'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js'; // Assuming Supabase is installed via npm

const SUPABASE_URL = 'https://adfxhdbkqbezzliycckx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZnhoZGJrcWJlenpsaXljY2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMTIxNjMsImV4cCI6MjA3Njg4ODE2M30.VHyryBwx19-KbBbEDaE-aySr0tn-pCERk9NZXQRzsYU';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BACKEND_URL = 'https://api.krishi.site';
const GOOGLE_CLIENT_ID = '660849662071-887qddbcaq013hc3o369oimmbbsf74ov.apps.googleusercontent.com';

const UserProfilePage: React.FC = () => {
  // Form states
  const [userName, setUserName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [mobileVerified, setMobileVerified] = useState<boolean>(false);
  const [otpSectionActive, setOtpSectionActive] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [sendOtpDisabled, setSendOtpDisabled] = useState<boolean>(false);
  const [verifyOtpDisabled, setVerifyOtpDisabled] = useState<boolean>(true);
  const [saveDisabled, setSaveDisabled] = useState<boolean>(true);
  const [userId, setUserId] = useState<string>('Loading...');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [errorModal, setErrorModal] = useState<string[]>([]);
  const [isGoogleButtonReady, setIsGoogleButtonReady] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [signupMethod, setSignupMethod] = useState<'mobile' | 'google'>('mobile');
  const [googleId, setGoogleId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const googleButtonContainerRef = useRef<HTMLDivElement>(null);
  const googleButtonWidthRef = useRef<number>(400);

  // URL params
  const searchParams = useSearchParams();
  const urlMobile = searchParams.get('mobile') || '';
  const urlUserId = searchParams.get('id') || '';
  const urlGoogleId = searchParams.get('google_id') || '';
  const urlMethod = searchParams.get('method') || 'mobile';

  useEffect(() => {
    setMobile(urlMobile);
    setUserId(urlUserId);
    setGoogleId(urlGoogleId);
    setSignupMethod(urlMethod as 'mobile' | 'google');
  }, [urlMobile, urlUserId, urlGoogleId, urlMethod]);

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

  const displayStatus = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const checkFormValidity = () => {
    const isBaseValid = userName.trim() && email.trim();
    const passwordValid = password.length >= 8;
    const mobileValid = mobileVerified;
    const canSave = isBaseValid && passwordValid && mobileValid;
    setSaveDisabled(!canSave);
  };

  const showErrorModal = (errors: string[]) => {
    setErrorModal(errors);
  };

  const closeErrorModal = () => {
    setErrorModal([]);
  };

  const handleSendOtp = async () => {
    const phoneInput = mobile.replace(/[^0-9]/g, '');
    if (phoneInput.length !== 10) {
      displayStatus('Please enter a valid 10-digit mobile number.', 'error');
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
        displayStatus('OTP sent to your mobile!', 'success');
      } else {
        throw new Error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error(error);
      displayStatus('Error sending OTP: ' + (error as Error).message, 'error');
      hideLoader();
    }
  };

  const handleOtpInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(value);
    setVerifyOtpDisabled(!(value.length === 6));
  };

  const handleVerifyOtp = async () => {
    const phoneInput = mobile.replace(/[^0-9]/g, '');
    const otpValue = otp;
    if (phoneInput.length !== 10 || otpValue.length !== 6) {
      displayStatus('Please enter valid phone and OTP.', 'error');
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
        setMobileVerified(true);
        setOtp('');
        setVerifyOtpDisabled(true);
        setOtpSectionActive(false);
        displayStatus('Phone number verified successfully!', 'success');
        checkFormValidity();
      } else {
        throw new Error(data.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error(error);
      displayStatus('Error verifying OTP. Please try again.', 'error');
      setOtp('');
      setVerifyOtpDisabled(true);
      hideLoader();
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    const id_token = response.credential;
    if (!id_token) {
      displayStatus('Google link failed.', 'error');
      return;
    }

    displayStatus('Linking Google account...', 'info');

    try {
      showLoader();
      const res = await fetch(`${BACKEND_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token, existing_user_id: userId }),
      });
      const data = await res.json();
      hideLoader();

      if (res.ok && data.success) {
        setUserName(data.user.user_name || userName);
        setEmail(data.user.email || email);
        displayStatus('Google account linked and profile updated!', 'success');
        checkFormValidity();
      } else {
        throw new Error(data.error || 'Linking failed');
      }
    } catch (err) {
      console.error('Google link error:', err);
      displayStatus('Failed to link Google account: ' + (err as Error).message, 'error');
    }
  };

  // Google Auth init
  useEffect(() => {
    const initializeGoogleButton = () => {
      if (!(window as any).google?.accounts?.id) {
        setTimeout(initializeGoogleButton, 100);
        return;
      }

      const saveButton = document.getElementById('save-button');
      if (saveButton) {
        googleButtonWidthRef.current = saveButton.offsetWidth;
      }

      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        ux_mode: 'popup',
      });

      if (googleButtonContainerRef.current) {
        (window as any).google.accounts.id.renderButton(googleButtonContainerRef.current, {
          theme: 'outline',
          text: 'continue_with',
          size: 'large',
          type: 'standard',
          width: googleButtonWidthRef.current,
        });
        
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

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      showLoader();
      if (!userId || userId === 'Loading...') {
        displayStatus('No user ID found for profile lookup.', 'error');
        hideLoader();
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/get-user-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: userId }),
        });
        const data = await response.json();

        if (response.ok && data.success && data.user) {
          const user = data.user;
          setUserName(user.user_name || '');
          setEmail(user.email || '');
          setMobile(user.mobile || '');
          setMobileVerified(!!user.mobile);

          // Handle signup flows
          if (signupMethod === 'google' || googleId) {
            // Lock name and email for Google
            // In React, we can disable inputs or use readOnly
          } else if (signupMethod === 'mobile') {
            // Adjustments for mobile signup
          }

          checkFormValidity();
        } else {
          throw new Error(data.error || 'User profile not found');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        displayStatus('Failed to load profile data: ' + (error as Error).message, 'error');
      }
      hideLoader();
    };

    if (userId !== 'Loading...') {
      loadProfile();
    }
  }, [userId, signupMethod, googleId]);

  // Input handlers
  useEffect(() => {
    checkFormValidity();
  }, [userName, email, password, mobileVerified]);

  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setMobile(value);
    if (value !== urlMobile) {
      setMobileVerified(false);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!userName.trim()) errors.push('User Name is required.');
    if (!email.trim()) errors.push('User Email is required.');
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push('Please enter a valid email address.');
    }
    if (!mobile.trim() || mobile.length !== 10) {
      errors.push('Valid 10-digit mobile number is required.');
    }
    if (!mobileVerified) {
      errors.push('Mobile number must be verified via OTP.');
    }
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters.');
    }
    return errors;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      showErrorModal(errors);
      return;
    }

    showLoader();
    setSaveDisabled(true);

    const payload = {
      id: userId,
      user_name: userName.trim(),
      email: email.trim(),
      ...(mobile && mobileVerified && { mobile }),
      ...(password && { password }),
    };

    try {
      const response = await fetch(`${BACKEND_URL}/save-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        displayStatus('Profile saved successfully! Redirecting...', 'success');
        setTimeout(() => {
          const googleParam = googleId ? `google_id=${googleId}&` : '';
          window.location.href = `https://www.krishi.site/shop-profile?${googleParam}id=${data.user?.id || userId}`;
        }, 1200);
      } else {
        throw new Error(data.error || 'Profile save failed');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      displayStatus('Error updating profile: ' + (error as Error).message, 'error');
    } finally {
      setSaveDisabled(false);
      hideLoader();
    }
  };

  return (
    <>
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

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .sunray-effect {
            animation: sunrayPulse 10s ease-in-out infinite alternate;
          }

          .god-rays {
            animation: godRays 15s ease-in-out infinite;
          }

          @media (max-width: 480px) {
            .profile-card { padding: 32px 24px !important; }
            .profile-title { font-size: 20px !important; }
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
          }}
        />
        <div 
          className="god-rays fixed top-0 left-0 w-[200%] h-[200%] pointer-events-none z-20"
          style={{
            background: 'radial-gradient(ellipse at 0% 0%, rgba(158,248,122,0.2) 0%, rgba(0,158,87,0.1) 30%, transparent 70%), linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.05) 45%, transparent 55%)',
            mixBlendMode: 'overlay' as const,
          }}
        />

        <div className="profile-container relative z-30 w-full max-w-[500px] mx-auto">
          <div className="profile-card bg-gradient-to-br from-[#101114] to-[#08090C] rounded-[24px] border border-white/5 p-[40px_32px] relative overflow-hidden mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="profile-content relative z-[2]">
              {/* Header */}
              <div className="profile-header flex items-center justify-center mb-8 gap-3">
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
              <h1 className="profile-title text-center text-[24px] font-bold text-white mb-2">Complete Your Profile</h1>
              <p className="profile-subtitle text-center text-base text-[#94a3b8] mb-8">Finish setting up your account to get started</p>

              {/* Status Message */}
              {statusMessage && (
                <div className={`status-message p-4 rounded-[12px] mb-6 text-sm ${statusMessage.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : statusMessage.type === 'error' ? 'bg-red-500/20 border border-red-500/30 text-red-500' : 'bg-blue-500/20 border border-blue-500/30 text-blue-400'}`}>
                  {statusMessage.text}
                </div>
              )}

              {/* Profile Form */}
              <form onSubmit={handleSave}>
                {/* User Name */}
                <div className="form-group mb-6">
                  <label htmlFor="userName" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="userName"
                    className="input-field w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b] read-only:bg-slate-800/40 read-only:text-[#94a3b8] read-only:cursor-not-allowed"
                    placeholder="Enter your full name"
                    maxLength={50}
                    required
                    readOnly={signupMethod === 'google'}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>

                {/* User Email */}
                <div className="form-group mb-6">
                  <label htmlFor="email" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="input-field w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b] read-only:bg-slate-800/40 read-only:text-[#94a3b8] read-only:cursor-not-allowed"
                    placeholder="your.email@example.com"
                    required
                    readOnly={signupMethod === 'google'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Google Link Section */}
                <div className={`google-link-section my-6 p-5 bg-slate-800/30 rounded-[12px] border border-white/5 ${isGoogleButtonReady ? 'block' : 'hidden'}`}>
                  <div className="google-link-title text-sm font-semibold text-[#94a3b8] mb-3 text-center">Link Google Account</div>
                  <div ref={googleButtonContainerRef} className="google-btn-container flex justify-center" style={{ height: '50px' }} />
                </div>

                {/* Divider */}
                <div className="divider flex items-center my-6 gap-4">
                  <div className="divider-line flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#334155] to-transparent" />
                  <span className="divider-text text-sm text-[#64748b]">or continue with</span>
                  <div className="divider-line flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#334155] to-transparent" />
                </div>

                {/* Mobile Number */}
                <div className="form-group mb-6">
                  <label htmlFor="mobileNumber" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2 flex items-center">
                    Mobile Number
                    <span className={`status-indicator ml-2 text-xs font-semibold ${mobileVerified ? 'text-green-400' : 'text-red-500'}`}>
                      {mobileVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </label>
                  <div className="mobile-otp-row flex gap-3">
                    <input
                      type="tel"
                      id="mobileNumber"
                      className="input-field flex-1 bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b] read-only:bg-slate-800/40 read-only:text-[#94a3b8] read-only:cursor-not-allowed"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      required
                      readOnly={mobileVerified && signupMethod === 'mobile'}
                      value={mobile}
                      onChange={handleMobileInput}
                    />
                    <button
                      type="button"
                      className={`otp-button whitespace-nowrap px-5 py-4 text-sm font-semibold text-white transition-all duration-300 rounded-[12px] border border-white/10 ${sendOtpDisabled ? 'opacity-50 cursor-not-allowed bg-slate-800/60' : 'bg-slate-800/60 hover:bg-slate-800/80 hover:border-[#9ef87a]/30'} ${countdown > 0 ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : ''}`}
                      disabled={sendOtpDisabled || mobileVerified}
                      onClick={handleSendOtp}
                    >
                      {countdown > 0 ? `OTP sent! ${formatTime(countdown)}` : 'Send OTP'}
                    </button>
                  </div>
                </div>

                {/* OTP Section */}
                <div className={`otp-section form-group mb-6 ${otpSectionActive ? 'block animate-[fadeIn_0.5s_ease-out]' : 'hidden'}`}>
                  <label htmlFor="otp-input" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">
                    Enter OTP
                  </label>
                  <div className="mobile-otp-row flex gap-3">
                    <input
                      type="text"
                      id="otp-input"
                      className="input-field flex-1 bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b] disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      disabled={!otpSectionActive || mobileVerified}
                      value={otp}
                      onChange={handleOtpInput}
                    />
                    <button
                      type="button"
                      className={`otp-button whitespace-nowrap px-5 py-4 text-sm font-semibold text-white transition-all duration-300 rounded-[12px] border border-white/10 ${verifyOtpDisabled ? 'opacity-50 cursor-not-allowed bg-slate-800/60' : 'bg-slate-800/60 hover:bg-slate-800/80 hover:border-[#9ef87a]/30'} ${mobileVerified ? 'bg-green-500/20 border-green-500/50 text-green-400' : ''}`}
                      disabled={verifyOtpDisabled || mobileVerified}
                      onClick={handleVerifyOtp}
                    >
                      {mobileVerified ? 'Verified ✓' : 'Verify'}
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className="form-group mb-6">
                  <label htmlFor="password" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">
                    Password
                  </label>
                  <div className="password-container relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className="input-field w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 pr-10 placeholder:text-[#64748b]"
                      placeholder="Create a secure password"
                      minLength={8}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-password absolute right-4 top-1/2 -translate-y-1/2 bg-none border-none text-[#94a3b8] hover:text-white transition-colors duration-200 cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={showPassword ? 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' : 'M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68'} />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  className={`save-button w-full bg-gradient-to-br from-[#9ef87a] to-[#009e57] text-white border-none rounded-[12px] px-4 py-4 text-base font-semibold transition-all duration-300 shadow-[0_4px_15px_rgba(0,158,87,0.4)] mt-2 ${saveDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:from-[#aefc90] hover:to-[#00b066] hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(0,158,87,0.6)] active:translate-y-0'}`}
                  id="save-button"
                  disabled={saveDisabled || loading}
                >
                  {loading ? 'Saving...' : 'Complete Profile'}
                </button>
              </form>

              {/* User ID Display */}
              <div className="user-id-display text-center text-xs text-[#64748b] mt-6">
                <p>Your User ID: <span id="user-id">{userId}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {errorModal.length > 0 && (
        <>
          <div className="modal-backdrop fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={closeErrorModal}>
            <div className="modal-content bg-slate-800/90 backdrop-blur-[20px] border border-white/10 rounded-[16px] p-6 w-[90%] max-w-[400px] shadow-[0_25px_50px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header flex items-center gap-3 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3 className="modal-title text-lg font-bold text-white">Validation Error</h3>
              </div>
              <div className="modal-body text-[#94a3b8] mb-6">
                <p>Please fix the following issues before updating your profile:</p>
                <ul className="error-list list-disc ml-5 text-red-500 mt-2">
                  {errorModal.map((err, idx) => <li key={idx}>{err}</li>)}
                </ul>
              </div>
              <button className="modal-button w-full bg-slate-800/60 border border-white/10 rounded-[12px] py-3 text-sm font-semibold text-white hover:bg-slate-800/80 transition-all duration-300" onClick={closeErrorModal}>
                Got It
              </button>
            </div>
          </div>
        </>
      )}

      {/* Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999]">
          <span className="loader w-12 h-12 rounded-full inline-block border-t-[3px] border-r-3 border-r-transparent border-[#34d399] box-border animate-[rotation_1s_linear_infinite]" />
        </div>
      )}
    </>
  );
};

export default UserProfilePage;
