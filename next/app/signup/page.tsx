'use client';

import React, { useState, useEffect, useRef } from 'react';

const BACKEND_URL = 'https://api.krishi.site';
const GOOGLE_CLIENT_ID = '660849662071-887qddbcaq013hc3o369oimmbbsf74ov.apps.googleusercontent.com';

const SignUpPage = () => {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSectionActive, setOtpSectionActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendOtpDisabled, setSendOtpDisabled] = useState(false);
  const [verifyOtpDisabled, setVerifyOtpDisabled] = useState(true);
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [isGoogleButtonReady, setIsGoogleButtonReady] = useState(false);

  const intervalRef = useRef(null);
  const googleButtonWidthRef = useRef(400);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startCountdown = (seconds) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCountdown(seconds);
    setSendOtpDisabled(true);

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
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

    setSendOtpDisabled(true);
    try {
      showLoader();
      const response = await fetch(`${BACKEND_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data = await response.json().catch(() => ({}));
      hideLoader();

      if (response.ok && data.success) {
        startCountdown(119);
        setOtpSectionActive(true);
      } else {
        setSendOtpDisabled(false);
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error.message);
      alert('Error sending OTP: ' + error.message);
      hideLoader();
      setSendOtpDisabled(false);
    }
  };

  const handleOtpInput = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setVerifyOtpDisabled(!(value.length === 6));
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
      const data = await response.json().catch(() => ({}));
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
      console.error('Error verifying OTP:', error.message);
      alert('Error verifying OTP: ' + error.message);
      setOtp('');
      setVerifyOtpDisabled(true);
      hideLoader();
    }
  };

  const handleSubmit = async (e) => {
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
      const data = await response.json().catch(() => ({}));
      hideLoader();

      if (response.ok && data.success) {
        alert('Account created successfully! Welcome to Krishi.');
        window.location.href = `https://www.krishi.site/user-profile?mobile=${mobileClean}&id=${data.user.id}`;
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error during registration:', error.message);
      alert('Error during registration: ' + error.message);
      hideLoader();
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    const id_token = response.credential;
    if (!id_token) return alert('Google sign-up failed.');

    try {
      showLoader();
      const res = await fetch(`${BACKEND_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token }),
      });
      const data = await res.json().catch(() => ({}));
      hideLoader();

      if (res.ok && data.success) {
        const user = data.user;
        const userId = user.id;
        const isProfileComplete =
          user.user_name && user.shop_name && user.shop_address &&
          user.user_name.trim() !== '' && user.shop_name.trim() !== '' && user.shop_address.trim() !== '';

        if (isProfileComplete) {
          window.location.href = `https://www.krishi.site/dashboard?id=${userId}`;
        } else {
          window.location.href = `https://www.krishi.site/user-profile?google_id=${encodeURIComponent(user.google_id || '')}&id=${userId}`;
        }
      } else {
        alert('Google sign-up failed: ' + (data.error || 'Unknown'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
      hideLoader();
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      const ref = document.getElementById('reg-submit-btn');
      if (ref) googleButtonWidthRef.current = ref.offsetWidth;

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
        setIsGoogleButtonReady(true);
      }
    };

    if (!document.getElementById('google-gsi')) {
      const script = document.createElement('script');
      script.id = 'google-gsi';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setTimeout(initGoogle, 100);
      document.head.appendChild(script);
    } else {
      setTimeout(initGoogle, 100);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-5 bg-[#0E0E0E] text-white overflow-x-hidden font-['Inter','Noto_Sans_Devanagari',sans-serif] antialiased">
        <div
          className="bg-pattern fixed inset-0 opacity-50 pointer-events-none bg-[length:100px_100px]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'
          }}
        />

        <div className="signup-container relative z-30 w-full max-w-[480px] mx-auto">
          <div className="text-center mb-6">
            <a href="https://www.krishi.site/login" className="text-blue-400 hover:text-blue-300 transition-colors duration-200 no-underline">
              Already have an account? <span className="font-semibold">Sign in</span> →
            </a>
          </div>

          <div className="signup-card bg-gradient-to-br from-[#101114] to-[#08090C] rounded-[24px] border border-white/5 p-[40px_32px] mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <h1 className="text-center text-[28px] font-bold text-white mb-2">Create your free account</h1>
            <p className="text-center text-base text-[#94a3b8] mb-8">Explore Krishi&apos;s core features for farmers and agri-businesses</p>

            {isGoogleButtonReady && (
              <div className="my-6 flex justify-center">
                <div id="google-register-btn" />
              </div>
            )}

            {isGoogleButtonReady && (
              <div className="flex items-center my-8 gap-4">
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#334155] to-transparent" />
                <span className="text-sm text-[#64748b]">or</span>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#334155] to-transparent" />
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group mb-6">
                <label htmlFor="reg-mobile" className="block text-sm font-semibold text-[#94a3b8] mb-2">Mobile Number</label>
                <div className="flex gap-3">
                  <input
                    type="tel"
                    id="reg-mobile"
                    className="flex-1 w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20"
                    placeholder="Enter your mobile number"
                    maxLength={10}
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  />
                  <button
                    type="button"
                    id="reg-send-otp"
                    className={`px-5 py-4 text-sm font-semibold text-white rounded-[12px] border border-white/10 transition-all duration-300 ${
                      sendOtpDisabled ? 'opacity-50 cursor-not-allowed' : 'bg-slate-800/60 hover:bg-slate-800/80 hover:border-[#9ef87a]/30'
                    } ${countdown > 0 ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : ''}`}
                    disabled={sendOtpDisabled}
                    onClick={handleSendOtp}
                  >
                    {countdown > 0 ? `OTP sent! ${formatTime(countdown)}` : 'Get OTP'}
                  </button>
                </div>
              </div>

              {otpSectionActive && (
                <div className="form-group mb-6">
                  <label htmlFor="reg-otp" className="block text-sm font-semibold text-[#94a3b8] mb-2">Enter OTP</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      id="reg-otp"
                      className="flex-1 w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      disabled={!otpSectionActive || verified}
                      value={otp}
                      onChange={handleOtpInput}
                    />
                    <button
                      type="button"
                      id="reg-verify-btn"
                      className={`px-5 py-4 text-sm font-semibold text-white rounded-[12px] border border-white/10 transition-all duration-300 ${
                        verifyOtpDisabled || verified ? 'opacity-50 cursor-not-allowed' : 'bg-slate-800/60 hover:bg-slate-800/80 hover:border-[#9ef87a]/30'
                      } ${verified ? 'bg-green-500/20 border-green-500/50 text-green-400' : ''}`}
                      disabled={verifyOtpDisabled || verified}
                      onClick={handleVerifyOtp}
                    >
                      {verified ? 'Verified ✓' : 'Verify OTP'}
                    </button>
                  </div>
                </div>
              )}

              <div className="form-group mb-6">
                <label htmlFor="reg-password" className="block text-sm font-semibold text-[#94a3b8] mb-2">Password</label>
                <input
                  type="password"
                  id="reg-password"
                  className="w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20"
                  placeholder="Create a secure password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className={`w-full bg-gradient-to-br from-[#9ef87a] to-[#009e57] text-white rounded-[12px] px-4 py-4 text-base font-semibold transition-all duration-300 mt-2 ${
                  submitDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:from-[#aefc90] hover:to-[#00b066]'
                }`}
                id="reg-submit-btn"
                disabled={submitDisabled}
              >
                Create account →
              </button>
            </form>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999]">
          <span className="loader w-12 h-12 rounded-full inline-block border-t-[3px] border-r-[3px] border-r-transparent border-[#34d399] animate-spin" />
        </div>
      )}
    </>
  );
};

export default SignUpPage;
