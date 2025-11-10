// @ts-nocheck
"use client";
// @ts-ignore
declare global {
  interface Window {
    google?: any;
  }
}

import React, { useState, useEffect, useCallback } from 'react';

// Configuation Constants
const BACKEND_URL = 'https://api.krishi.site';
const GOOGLE_CLIENT_ID = '660849662071-887qddbcaq013hc3o369oimmbbsf74ov.apps.googleusercontent.com';

// Custom CSS for complex backgrounds, animations, and gradients that are hard to express purely in Tailwind
const customStyles = `
/* Global & Body Styles */
body {
    font-family: 'Inter', 'Noto Sans Devanagari', sans-serif;
    color: #fff;
}

/* Background & Aesthetics */
@keyframes sunrayPulse {
    0%, 100% { opacity: 0.95; }
    50% { opacity: 0.85; }
}
.sunray-effect {
    background: radial-gradient(circle at top center, rgba(20, 20, 20, 0.5) 0%, rgba(7, 7, 7, 1) 70%);
    animation: sunrayPulse 10s ease-in-out infinite alternate;
}
.bg-pattern {
    background-image: 
        repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px),
        repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px);
    background-size: 100px 100px;
}
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-in { animation: fadeInUp 1s ease-out forwards; opacity: 0; }
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }
.delay-400 { animation-delay: 0.4s; }
.delay-500 { animation-delay: 0.5s; }
.delay-600 { animation-delay: 0.6s; }
.delay-700 { animation-delay: 0.7s; }
.delay-800 { animation-delay: 0.8s; }

/* Logo Text Gradient */
.logo-text {
    background: linear-gradient(135deg, #9ef87a 0%, #009e57 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

/* Hero Title Gradients and Positioning */
.hero-title {
  font-family: 'Noto Sans Devanagari', 'Inter', sans-serif;
  font-size: 94px;
  font-weight: 900;
  line-height: 1;
}
.hero-text {
  display: inline-block;
  background: linear-gradient(45deg, #27C48B 0%, #DDC53B 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-fill-color: transparent;
  padding-top: 20px;
  padding-bottom: 20px;
  margin-top: -20px;
  margin-bottom: -20px;
}
.hero-sub {
  position: absolute;
  bottom: -3px;
  left: 50%;
  transform: translateX(-40%);
  font-size: 0.25em;
  font-weight: 800;
  letter-spacing: 0.02em;
  white-space: nowrap;
  background: linear-gradient(135deg, #9ef87a 0%, #009e57 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 8px rgba(0, 158, 87, 0.25);
}
.hero-highlight-span {
    background: linear-gradient(135deg, #9ef87a 0%, #009e57 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
}

/* Animated Icon */
@keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
}
.icon-glow {
    filter: blur(20px);
    animation: pulse 2s ease-in-out infinite;
}

/* Buttons */
.btn-login {
    background: linear-gradient(135deg, #9ef87a 0%, #009e57 100%);
    box-shadow: 0 4px 15px rgba(0, 158, 87, 0.4);
}
.btn-login:hover {
    background: linear-gradient(135deg, #aefc90 0%, #00b066 100%);
    box-shadow: 0 6px 20px rgba(0, 158, 87, 0.6);
}

/* Journey Card (Glass Effect & Glow) */
.journey-card {
    background: rgba(15, 23, 42, 0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.05);
}
@keyframes glassGlow {
    0% { opacity: 0.5; filter: blur(12px); }
    100% { opacity: 0.8; filter: blur(18px); }
}
.journey-card::after {
    content: '';
    position: absolute;
    top: -2px; left: -2px; right: -2px; bottom: -2px;
    background: linear-gradient(135deg, rgba(158, 248, 122, 0.3) 0%, rgba(0, 158, 87, 0.1) 50%, transparent 100%);
    border-radius: 26px;
    z-index: -1;
    filter: blur(15px);
    opacity: 0.7;
    animation: glassGlow 3s ease-in-out infinite alternate;
}
.journey-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg, rgba(158, 248, 122, 0.1) 0%, rgba(0, 158, 87, 0.05) 50%, transparent 100%);
    border-radius: 24px;
    pointer-events: none;
    z-index: 1;
}

/* Step Icons */
.step-icon {
    background: rgba(158, 248, 122, 0.15);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(158, 248, 122, 0.3);
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
.step:hover .step-icon {
    background: rgba(158, 248, 122, 0.25);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
.step-connector {
    background: linear-gradient(to bottom, #9ef87a 0%, #009e57 100%);
}
.step-title {
    transition: all 0.3s ease;
}
.step:hover .step-title {
    color: #009e57;
}

/* Success Step */
@keyframes pulse-slow {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
}
.step-success .step-icon {
    animation: pulse-slow 3s ease-in-out infinite;
}
.success-dot {
    animation: ping 2s ease-in-out infinite;
}
@keyframes ping {
    75%, 100% { transform: scale(2); opacity: 0; }
}

/* GSI Button Override */
.g_id_signin {
    border-radius: 9999px !important;
    box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1) !important;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.g_id_signin:hover {
    transform: scale(1.02);
    box-shadow: 0 6px 20px rgba(255, 255, 255, 0.15) !important;
}
`;

// Helper function to dynamically load the Google GSI script
const loadGsiScript = () => {
    return new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) {
            return resolve(true);
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Failed to load Google GSI script.'));
        document.head.appendChild(script);
    });
};

const KrishiLogoIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24"
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="url(#logoGradient)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ display: 'block' }}
    >
        <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9ef87a" />
                <stop offset="100%" stopColor="#009e57" />
            </linearGradient>
        </defs>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
);

const App = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [loginBtnWidth, setLoginBtnWidth] = useState(332);

    // Handles the response from Google (unified reg/login logic)
    const handleGoogleCredentialResponse = useCallback(async (response) => {
        const id_token = response.credential;
        if (!id_token) return console.error('Google sign-up failed: Token missing.');

        try {
            setIsLoading(true);
            const res = await fetch(`${BACKEND_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                const user = data.user;
                const userId = user.id;

                // Check profile completion status from the original logic
                const isProfileComplete = user.user_name && user.shop_name && user.shop_address &&
                                          user.user_name.trim() !== '' && user.shop_name.trim() !== '' && user.shop_address.trim() !== '';

                if (isProfileComplete) {
                    window.location.href = `https://www.krishi.site/dashboard?id=${userId}`;
                } else {
                    window.location.href = `https://www.krishi.site/user-profile?google_id=${encodeURIComponent(user.google_id || '')}&id=${userId}`;
                }
            } else {
                console.error('Google sign-up failed or login error:', data.error || 'Unknown error');
            }
        } catch (err) {
            console.error('Network Error during Google sign-in:', err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Effect to handle GSI script loading and button initialization
    useEffect(() => {
        const initGoogleButton = async () => {
            try {
                await loadGsiScript();
                
                // Calculate width based on the login button reference
                const referenceElement = document.getElementById('btn-login-ref'); 
                if (referenceElement) {
                    // Get the computed width of the login button for reference
                    const width = referenceElement.offsetWidth;
                    // Max width is constrained by the container CSS
                    setLoginBtnWidth(width > 332 ? 332 : width); 
                } else {
                    console.warn('Could not find the reference login button for width calculation. Using default width 332.');
                }
                
                if (window.google?.accounts?.id) {
                    // Initialize the Google Sign-in client
                    window.google.accounts.id.initialize({
                        client_id: GOOGLE_CLIENT_ID,
                        callback: handleGoogleCredentialResponse,
                        ux_mode: 'popup'
                    });

                    const registerBtnContainer = document.getElementById('google-register-btn');
                    if (registerBtnContainer) {
                        // Render the Google button
                        window.google.accounts.id.renderButton(registerBtnContainer, {
                            theme: 'filled_white', 
                            text: 'continue_with', 
                            size: 'large', 
                            type: 'standard', 
                            width: loginBtnWidth, // Use state value
                        });
                    }
                }
            } catch (error) {
                console.error(error.message);
            }
        };
        
        // Use a timeout to ensure the DOM is fully settled before measuring width and initializing GSI
        const timeoutId = setTimeout(initGoogleButton, 100);

        return () => clearTimeout(timeoutId); // Cleanup timeout
    }, [handleGoogleCredentialResponse, loginBtnWidth]); // loginBtnWidth dependency is for the width calculation delay

    return (
        <>
            {/* Inject Custom CSS Styles */}
            <style>{customStyles}</style>
            
            {/* Note: In a real Next.js app, external fonts and the GSI script would be in _document.js or layout file. */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;700;800;900&display=swap" rel="stylesheet" />

            {/* FIXED BACKGROUND WRAPPER */}
            <div className="bg-fixed fixed inset-0 overflow-hidden z-0 bg-[#0e0e0e] will-change-transform transform translate-z-0 backface-visibility-hidden">
                <div className="bg-pattern absolute inset-0 pointer-events-none transform translate-z-0"></div>
                <div className="sunray-effect absolute inset-0 pointer-events-none transform translate-z-0"></div>
            </div>

            {/* Main Content Container (Mobile-First Max Width) */}
            <div className="relative z-10 max-w-[380px] mx-auto px-6 pt-6">


                {/* Header */}
                <header className="flex items-center py-6 animate-in">
                    <div className="flex items-center cursor-pointer transition-all duration-300 gap-2">
                        <div className="logo-icon">
                            <KrishiLogoIcon />
                        </div>
                        <span className="logo-text text-xl font-extrabold leading-none">krishi</span>
                    </div>
                </header>

                {/* Animated Glow Only */}
                <div className="animated-icon-wrapper flex justify-center mt-12 mb-6 relative animate-in delay-100">
                    <div className="icon-glow absolute inset-0 bg-gradient-to-br from-green-400/40 to-emerald-500/40 rounded-xl"></div>
                    <div className="relative z-20 w-16 h-16 bg-gradient-to-br from-green-400/20 to-emerald-500/20 backdrop-blur-md border border-green-400/30 rounded-xl flex items-center justify-center">
                        {/* Leaf Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ef87a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                        </svg>
                    </div>
                </div>

                {/* Hero Section */}
                <div className="text-center mb-8 animate-in delay-200">
                    <h1 className="hero-title relative inline-block text-white">
                        <span className="hero-text">कृषी</span>
                        <span className="hero-sub">.site</span>
                    </h1>
                    <p className="text-2xl font-bold text-white mb-2">The fastest path from</p>
                    <p className="text-2xl font-bold text-white">
                        farm to <span className="hero-highlight-span">digital market</span>
                    </p>
                    <p className="mt-6 text-sm text-slate-400">
                        Already have an account? <a href="https://www.krishi.site/login" className="text-blue-400 hover:text-blue-300 transition-colors duration-200">Sign in</a>
                    </p>
                </div>

                {/* Google Sign-in Button */}
                <div className="animate-in delay-300 mb-4 flex justify-center">
                    {/* This DIV will be filled by the Google GSI script */}
                    <div id="google-register-btn" className="g_id_signin"></div>
                </div>

                {/* Divider */}
                <div className="flex items-center my-6 gap-4 animate-in delay-400">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                    <span className="text-sm text-slate-500">Or start with login</span>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-700 to-transparent"></div>
                </div>

                {/* Login Button */}
                <div className="animate-in delay-500">
                    <button 
                        className="btn-login text-white w-full py-2 px-6 font-semibold border-none rounded-lg flex items-center justify-center gap-3 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 hover:scale-[1.02] active:scale-[0.98]"
                        id="btn-login-ref" 
                        onClick={() => window.location.href='https://www.krishi.site/signup'}
                        disabled={isLoading}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/>
                            <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/>
                            <path d="M12 3v6"/>
                        </svg>
                        <span>Create an Account</span>
                    </button>
                </div>

                {/* Terms */}
                <p className="text-center text-xs text-slate-500 mt-4 mb-8 leading-relaxed animate-in delay-600">
                    नए उपयोगकर्ता: Register करें। मौजूदा उपयोगकर्ता: Login करें।<br/>
                    यह मंच किसानों और कृषी-केंद्रों के लिए है।
                </p>

                {/* Scroll Indicator */}
                <div className="flex flex-col items-center mb-12 animate-in delay-700">
                    <div className="flex items-center gap-2 text-sm text-[#009e57]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce">
                            <path d="m6 9 6 6 6-6"/>
                        </svg>
                        <span>Scroll to see your journey</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce">
                            <path d="m6 9 6 6 6-6"/>
                        </svg>
                    </div>
                </div>

                {/* Journey Card (Glass) */}
                <div className="journey-card relative rounded-xl p-5 mb-16 overflow-hidden animate-in delay-800">

                    <h2 className="text-center text-xl font-extrabold text-white mb-5 relative z-20 leading-tight">Digital Krishi Store<br/>in 4 Steps</h2>

                    {/* Step 1 */}
                    <div className="step flex mb-2 items-start cursor-pointer transition-all duration-300">
                        <div className="step-icon-wrapper flex flex-col items-center mr-4 flex-shrink-0">
                            <div className="step-icon w-[42px] h-[42px] rounded-xl flex items-center justify-center transition-all duration-300">
                                {/* Create Profile Icon (Seed) */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>
                                </svg>
                            </div>
                            <div className="step-connector w-0.5 h-6 my-0.5"></div>
                        </div>
                        <div className="step-content pt-0.5 flex-1 relative z-20">
                            <h3 className="step-title text-[15px] font-bold text-white mb-0.5">Create a Profile</h3>
                            <p className="step-description text-xs text-slate-400 leading-snug">Sign up and tell us about your farm or agribusiness.</p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="step flex mb-2 items-start cursor-pointer transition-all duration-300">
                        <div className="step-icon-wrapper flex flex-col items-center mr-4 flex-shrink-0">
                            <div className="step-icon w-[42px] h-[42px] rounded-xl flex items-center justify-center transition-all duration-300">
                                {/* Digital Store Icon (Shopping Bag) */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/>
                                </svg>
                            </div>
                            <div className="step-connector w-0.5 h-6 my-0.5"></div>
                        </div>
                        <div className="step-content pt-0.5 flex-1 relative z-20">
                            <h3 className="step-title text-[15px] font-bold text-white mb-0.5">Create Digital Store</h3>
                            <p className="step-description text-xs text-slate-400 leading-snug">Add products, seeds, or fertilizers to your catalog.</p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="step flex mb-2 items-start cursor-pointer transition-all duration-300">
                        <div className="step-icon-wrapper flex flex-col items-center mr-4 flex-shrink-0">
                            <div className="step-icon w-[42px] h-[42px] rounded-xl flex items-center justify-center transition-all duration-300">
                                {/* Publish Icon (Network) */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
                                </svg>
                            </div>
                            <div className="step-connector w-0.5 h-6 my-0.5"></div>
                        </div>
                        <div className="step-content pt-0.5 flex-1 relative z-20">
                            <h3 className="step-title text-[15px] font-bold text-white mb-0.5">Publish Online Store</h3>
                            <p className="step-description text-xs text-slate-400 leading-snug">Set shipping options and payment methods, then go live!</p>
                        </div>
                    </div>

                    {/* Step 4 - Success */}
                    <div className="step step-success flex mb-0 items-start">
                        <div className="step-icon-wrapper flex flex-col items-center mr-4 flex-shrink-0">
                            <div className="step-icon w-[42px] h-[42px] rounded-xl flex items-center justify-center transition-all duration-300 bg-[#9ef87a]/20 border border-[#9ef87a]/40">
                                {/* Checkmark Icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ef87a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6 9 17l-5-5"/>
                                </svg>
                            </div>
                        </div>
                        <div className="step-content pt-0.5 flex-1 relative z-20">
                            <h3 className="step-title text-[15px] font-bold text-[#009e57] mb-0.5 flex items-center gap-2">
                                Store Ready!
                                <div className="success-dots flex gap-1">
                                    <div className="success-dot w-[5px] h-[5px] bg-[#009e57] rounded-full" style={{ animationDelay: '0s' }}></div>
                                    <div className="success-dot w-[5px] h-[5px] bg-[#009e57] rounded-full" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="success-dot w-[5px] h-[5px] bg-[#009e57] rounded-full" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </h3>
                            <p className="step-description text-xs text-[#009e57] font-medium leading-snug">Manage orders, track sales, and grow your krishi business!</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loader Overlay */}
            {isLoading && (
                <div id="loader-overlay" className="fixed inset-0 bg-[#070707]/90 flex items-center justify-center z-[9999]">
                    <span className="w-12 h-12 rounded-full inline-block border-t-4 border-green-500 border-r-4 border-r-transparent box-border animate-spin"></span>
                </div>
            )}
        </>
    );
}

export default function Page() {
  return <App />;
}
