'use client';

import React, { useState, useEffect, useRef } from 'react';

const BACKEND_URL = 'https://api.krishi.site';
const GOOGLE_CLIENT_ID = '660849662071-887qddbcaq013hc3o369oimmbbsf74ov.apps.googleusercontent.com';
const SUPABASE_URL = 'https://adfxhdbkqbezzliycckx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZnhoZGJrcWJlenpsaXljY2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMTIxNjMsImV4cCI6MjA3Njg4ODE2M30.VHyryBwx19-KbBbEDaE-aySr0tn-pCERk9NZXQRzsYU';

const CompleteProfilePage: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [mobileVerified, setMobileVerified] = useState<boolean>(false);
  const [isGoogleButtonReady, setIsGoogleButtonReady] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalErrors, setModalErrors] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>('Loading...');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [userNameLocked, setUserNameLocked] = useState<boolean>(false);
  const [emailLocked, setEmailLocked] = useState<boolean>(false);
  const [mobileLocked, setMobileLocked] = useState<boolean>(false);
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  
  const googleButtonContainerRef = useRef<HTMLDivElement>(null);
  const otpIntervalRef = useRef<NodeJS.Timeout>();
  const currentMobileRef = useRef<string>('');

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  // Get URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const mobile = urlParams.get('mobile');
      const id = urlParams.get('id');
      const googleId = urlParams.get('google_id');
      
      if (mobile) {
        setMobileNumber(mobile);
        currentMobileRef.current = mobile;
      }
      if (id) setUserId(id);
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      otpIntervalRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (otpIntervalRef.current) {
      clearTimeout(otpIntervalRef.current);
    }
    
    return () => {
      if (otpIntervalRef.current) {
        clearTimeout(otpIntervalRef.current);
      }
    };
  }, [countdown]);

  const displayStatus = (message: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage({ text: message, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startCountdown = (seconds: number) => {
    setOtpSent(true);
    setCountdown(seconds);
  };

  const checkFormValidity = () => {
    const isBaseValid = userName.trim() && email.trim();
    const passwordValid = password.length >= 8;
    const mobileValid = mobileVerified;
    
    return isBaseValid && passwordValid && mobileValid;
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    const id_token = response.credential;
    if (!id_token) {
      displayStatus('Google link failed.', 'error');
      return;
    }

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
        setUserNameLocked(true);
        setEmailLocked(true);
        displayStatus('Google account linked and profile updated!', 'success');
      } else {
        throw new Error(data.error || 'Linking failed');
      }
    } catch (err) {
      console.error('Google link error:', err);
      displayStatus('Failed to link Google account: ' + (err as Error).message, 'error');
    }
  };

  // Google Auth Integration
  useEffect(() => {
    const initializeGoogleButton = () => {
      if (!(window as any).google?.accounts?.id) {
        setTimeout(initializeGoogleButton, 500);
        return;
      }

      const referenceElement = document.getElementById('save-button');
      let desiredWidth = 400;

      if (referenceElement) {
        desiredWidth = referenceElement.offsetWidth;
      }
      
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        ux_mode: 'popup'
      });

      const linkBtnContainer = document.getElementById('google-link-btn');
      if (linkBtnContainer) {
        (window as any).google.accounts.id.renderButton(linkBtnContainer, {
          theme: 'outline',
          text: 'continue_with',
          size: 'large',
          type: 'standard',
          width: desiredWidth,
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
  }, [userId]);

  const handleSendOtp = async () => {
    const phoneInput = mobileNumber.replace(/[^0-9]/g, '');
    if (phoneInput.length !== 10) {
      displayStatus('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }
    currentMobileRef.current = phoneInput;

    try {
      showLoader();
      const response = await fetch(`${BACKEND_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: currentMobileRef.current })
      });
      const data = await response.json();
      hideLoader();

      if (response.ok && data.success) {
        startCountdown(119);
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

  const handleVerifyOtp = async () => {
    const otpValue = otp;
    if (currentMobileRef.current.length !== 10 || otpValue.length !== 6) {
      displayStatus('Please enter valid phone and OTP.', 'error');
      return;
    }

    try {
      showLoader();
      const response = await fetch(`${BACKEND_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: currentMobileRef.current, otp: otpValue })
      });
      const data = await response.json();
      hideLoader();

      if (response.ok && data.success) {
        setMobileVerified(true);
        setMobileLocked(true);
        displayStatus('Phone number verified successfully!', 'success');
      } else {
        throw new Error(data.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error(error);
      displayStatus('Error verifying OTP. Please try again.', 'error');
      setOtp('');
      hideLoader();
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setMobileNumber(value);
    
    if (value !== currentMobileRef.current) {
      setMobileVerified(false);
      setOtpSent(false);
      setCountdown(0);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(value);
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!userNameLocked && !userName.trim()) errors.push("User Name is required.");
    if (!emailLocked && !email.trim()) errors.push("User Email is required.");
    
    if (!emailLocked && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push("Please enter a valid email address.");
      }
    }
    
    if (!mobileLocked) {
      if (!mobileNumber.trim() || mobileNumber.length !== 10) {
        errors.push("Valid 10-digit mobile number is required.");
      }
      if (!mobileVerified) {
        errors.push("Mobile number must be verified via OTP.");
      }
    }
    
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters.");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      setModalErrors(errors);
      setModalOpen(true);
      return;
    }

    showLoader();

    const payload = {
      id: userId,
      user_name: userName.trim(),
      email: email.trim(),
      mobile: mobileVerified ? currentMobileRef.current : undefined,
      password: password,
    };

    try {
      const res = await fetch(`${BACKEND_URL}/save-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const responseText = await res.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error(`Server returned invalid response: ${responseText.substring(0, 100)}`);
      }
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      if (data.success) {
        displayStatus('Profile saved successfully! Redirecting...', 'success');
        const redirectId = data.user?.id || userId;
        
        setTimeout(() => {
          const urlParams = new URLSearchParams(window.location.search);
          const googleId = urlParams.get('google_id');
          const googleParam = googleId ? `google_id=${googleId}&` : '';
          window.location.href = `https://www.krishi.site/shop-profile?${googleParam}id=${redirectId}`;
        }, 1200);
      } else {
        throw new Error(data.error || 'Profile save failed');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      displayStatus('Error updating profile: ' + (error as Error).message, 'error');
    } finally {
      hideLoader();
    }
  };

  return (
    <>
      {/* Scoped Page Wrapper */}
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
                <div className={`status-message p-4 rounded-[12px] mb-6 text-sm ${
                  statusMessage.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' :
                  statusMessage.type === 'error' ? 'bg-red-500/20 border border-red-500/30 text-red-400' :
                  'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                }`}>
                  {statusMessage.text}
                </div>
              )}

              {/* Profile Form */}
              <form onSubmit={handleSubmit}>
                {/* User Name */}
                <div className="form-group mb-6">
                  <label htmlFor="userName" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="userName"
                    className={`input-field w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b] ${
                      userNameLocked ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    placeholder="Enter your full name"
                    maxLength={50}
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    readOnly={userNameLocked}
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
                    className={`input-field w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b] ${
                      emailLocked ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    placeholder="your.email@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={emailLocked}
                  />
                </div>

                {/* Google Link Section */}
                <div className="google-link-section my-6 p-5 bg-[#1e293b]/30 rounded-[12px] border border-white/5">
                  <div className="google-link-title text-sm font-semibold text-[#94a3b8] mb-3 text-center">
                    Link Google Account
                  </div>
                  <div className="google-btn-container flex justify-center">
                    <div 
                      id="google-link-btn"
                      ref={googleButtonContainerRef}
                      className="transition-opacity duration-300"
                      style={{ opacity: isGoogleButtonReady ? 1 : 0 }}
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="divider flex items-center my-6 gap-4">
                  <div className="divider-line flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#334155] to-transparent" />
                  <span className="divider-text text-sm text-[#64748b]">or continue with</span>
                  <div className="divider-line flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#334155] to-transparent" />
                </div>

                {/* Mobile Number */}
                <div className="form-group mb-6">
                  <label htmlFor="mobileNumber" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">
                    Mobile Number
                    <span className={`status-indicator inline-flex items-center gap-1.5 text-xs font-semibold ml-2 ${
                      mobileVerified ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {mobileVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </label>
                  <div className="mobile-otp-row flex gap-3">
                    <input
                      type="tel"
                      id="mobileNumber"
                      className={`input-field mobile-input flex-1 bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b] ${
                        mobileLocked ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      required
                      value={mobileNumber}
                      onChange={handleMobileChange}
                      readOnly={mobileLocked}
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={countdown > 0 || mobileLocked}
                      className={`otp-button px-5 py-4 rounded-[12px] border text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                        countdown > 0 
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 cursor-not-allowed' 
                          : mobileLocked
                          ? 'bg-gray-500/20 border-gray-500/50 text-gray-400 cursor-not-allowed'
                          : 'bg-[#1e293b] border-white/10 text-white hover:bg-[#1e293b]/80 hover:border-[#9ef87a]/30'
                      }`}
                    >
                      {countdown > 0 ? `OTP sent! ${formatTime(countdown)}` : 'Send OTP'}
                    </button>
                  </div>
                </div>

                {/* OTP Section */}
                {(otpSent || mobileVerified) && (
                  <div className="otp-section form-group mb-6 animate-[fadeIn_0.5s_ease-out]">
                    <label htmlFor="otp-input" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">
                      Enter OTP
                    </label>
                    <div className="mobile-otp-row flex gap-3">
                      <input
                        type="text"
                        id="otp-input"
                        className="input-field mobile-input flex-1 bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b]"
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        value={otp}
                        onChange={handleOtpChange}
                        disabled={mobileVerified}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otp.length !== 6 || mobileVerified}
                        className={`otp-button px-5 py-4 rounded-[12px] border text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                          mobileVerified
                            ? 'bg-green-500/20 border-green-500/50 text-green-400 cursor-not-allowed'
                            : otp.length === 6
                            ? 'bg-[#1e293b] border-white/10 text-white hover:bg-[#1e293b]/80 hover:border-[#9ef87a]/30'
                            : 'bg-gray-500/20 border-gray-500/50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {mobileVerified ? 'Verified ✓' : 'Verify'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Password */}
                <div className="form-group mb-6">
                  <label htmlFor="password" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">
                    Password
                  </label>
                  <div className="password-container relative">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      id="password"
                      className="input-field w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b] pr-12"
                      placeholder="Create a secure password"
                      minLength={8}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="toggle-password absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none text-[#94a3b8] hover:text-white transition-colors duration-200 cursor-pointer"
                    >
                      {passwordVisible ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  id="save-button"
                  className="save-button w-full bg-gradient-to-br from-[#9ef87a] to-[#009e57] text-white border-none rounded-[12px] px-4 py-4 text-base font-semibold transition-all duration-300 shadow-[0_4px_15px_rgba(0,158,87,0.4)] hover:from-[#aefc90] hover:to-[#00b066] hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(0,158,87,0.6)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-[0_4px_15px_rgba(0,158,87,0.4)]"
                  disabled={!checkFormValidity() || loading}
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
      {modalOpen && (
        <div className="modal-backdrop fixed inset-0 bg-black/80 flex justify-center items-center z-50">
          <div className="modal-content bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 rounded-[16px] p-6 w-[90%] max-w-[400px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
            <div className="modal-header flex items-center gap-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3 className="modal-title text-lg font-bold text-white">Validation Error</h3>
            </div>
            <div className="modal-body text-[#94a3b8] mb-6">
              <p>Please fix the following issues before updating your profile:</p>
              <ul id="modal-error-list" className="error-list list-disc ml-5 text-red-400 mt-2">
                {modalErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
            <button 
              onClick={() => setModalOpen(false)}
              className="modal-button w-full bg-[#1e293b] border border-white/10 rounded-[12px] px-3 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#1e293b]/80"
            >
              Got It
            </button>
          </div>
        </div>
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

export default CompleteProfilePage;
