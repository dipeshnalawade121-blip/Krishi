'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

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
    const passwordValid = password.length >= 8 || signupMethod === 'google'; // Skip pw for Google if not needed
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
        // Hide Google section after linking
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
        (window
