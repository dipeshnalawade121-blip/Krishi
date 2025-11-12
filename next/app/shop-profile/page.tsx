'use client';

import React, { useState, useEffect, useRef, memo, cache } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useFormStatus } from 'react-dom'; // For Server Actions progress
import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'react-map-gl/maplibre-gl.css'; // Or mapbox-gl.css if using Mapbox style

// Types for Geolocation (TS Fix)
interface GeolocationPosition { 
  coords: { latitude: number; longitude: number; accuracy: number }; 
}
interface GeolocationPositionError { 
  code: number; 
  message: string; 
}

// Global Window Declaration for Mapbox (TS Fix)
declare global { 
  interface Window { 
    mapboxgl?: any; 
  } 
}

const BACKEND_URL = 'https://api.krishi.site';
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGlwZXNoNjM2NiIsImEiOiJjbWhraTZ1ZGgwYTFxMmlzYzdxcGlibzJnIn0.B62FIHq1WSsXbl_xcag-QA';

// Dynamic Map Import for PPR (Enhancement 7)
const DynamicMap = dynamic(
  () => import('react-map-gl').then(mod => ({ default: mod.Map })),
  { ssr: false, loading: () => <div className="h-[200px] w-full flex items-center justify-center bg-[#0D1117]/60 text-[#64748b] rounded-[12px] border border-white/10 animate-pulse">Loading map...</div> }
);

// Server Action (Enhancement 1) - Assume actions.ts exists; for demo, inline as async
async function saveShopProfile(formData: FormData) {
  'use server'; // If in separate file
  const payload = {
    id: formData.get('id'),
    shop_name: formData.get('shop_name'),
    shop_number: formData.get('shop_number'),
    shop_address: formData.get('shop_address')
  };
  // Simulate backend call
  const res = await fetch(`${BACKEND_URL}/save-shop-profile`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Save failed');
  return data;
}

// Cached Profile Load (Enhancement 3)
const cachedLoadProfile = cache(async (userId: string) => {
  if (!userId || userId === 'Loading...') return null;
  const payload = { id: userId };
  const res = await fetch(`${BACKEND_URL}/get-user-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success || !data.user) throw new Error(data.error || 'Not found');
  return data.user;
});

// Memoized Input Field (Enhancement 2)
const MemoInput = memo(({ id, value, onChange, placeholder, minLength, maxLength, type = 'text', required }: {
  id: string; value: string; onChange: (v: string) => void; placeholder: string; minLength?: number; maxLength?: number; type?: string; required?: boolean;
}) => (
  <input
    id={id}
    type={type}
    minLength={minLength}
    maxLength={maxLength}
    placeholder={placeholder}
    className="input-field w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b]"
    required={required}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
));

// Memoized Textarea
const MemoTextarea = memo(({ id, value, onChange, placeholder, rows = 3, maxLength = 200, required }: {
  id: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number; maxLength?: number; required?: boolean;
}) => (
  <textarea
    id={id}
    placeholder={placeholder}
    rows={rows}
    maxLength={maxLength}
    className="input-field textarea-field w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b] min-h-[100px] resize-vertical"
    required={required}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
));

const ShopProfilePage: React.FC = () => {
  // Form states
  const [shopName, setShopName] = useState<string>('');
  const [shopNumber, setShopNumber] = useState<string>('');
  const [shopAddress, setShopAddress] = useState<string>('');
  const [userId, setUserId] = useState<string>('Loading...');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [errorModal, setErrorModal] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saveDisabled, setSaveDisabled] = useState<boolean>(true);
  const [viewState, setViewState] = useState<{ longitude: number; latitude: number; zoom: number }>({
    longitude: 78.9629,
    latitude: 20.5937,
    zoom: 4
  });
  const [marker, setMarker] = useState<{ longitude: number; latitude: number } | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);

  // URL params
  const searchParams = useSearchParams();
  const urlUserId = searchParams.get('id') || '';
  const urlGoogleId = searchParams.get('google_id') || '';

  useEffect(() => {
    setUserId(urlUserId);
    if (urlUserId) {
      localStorage.setItem('user_id', urlUserId);
      sessionStorage.setItem('user_id', urlUserId);
      console.log("✅ USER_ID stored for dashboard:", urlUserId);
    }
  }, [urlUserId]);

  // Load Profile (Enhanced with Cache)
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await cachedLoadProfile(urlUserId);
        if (user) {
          setShopName(user.shop_name || '');
          setShopNumber(user.shop_number || '');
          setShopAddress(user.shop_address || '');
          // Geocode existing (simulate with setViewState if address)
          if (user.shop_address) {
            // Assume geocoded coords; set marker/view
            setViewState({ longitude: 78.9629, latitude: 20.5937, zoom: 15 }); // Placeholder
            setMarker({ longitude: 78.9629, latitude: 20.5937 });
          }
        }
      } catch (error) {
        displayStatus('Failed to load: ' + (error as Error).message, 'error');
      }
      checkFormValidity();
    };
    if (urlUserId && urlUserId !== 'Loading...') loadData();
  }, [urlUserId]);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  const displayStatus = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const checkFormValidity = () => {
    const nameLen = shopName.trim().length;
    const addrLen = shopAddress.trim().length;
    const isValid = nameLen >= 3 && nameLen <= 30 &&
                    shopNumber.length === 10 && 
                    addrLen >= 10 && addrLen <= 200;
    setSaveDisabled(!isValid);
  };

  const showErrorModal = (errors: string[]) => {
    setErrorModal(errors);
  };

  const closeErrorModal = () => {
    setErrorModal([]);
  };

  const validateForm = () => {
    const errors: string[] = [];
    const nameLen = shopName.trim().length;
    const addrLen = shopAddress.trim().length;
    if (!shopName.trim() || nameLen < 3) errors.push("Shop Name required (min 3 chars).");
    else if (nameLen > 30) errors.push("Shop Name max 30 chars.");
    if (!shopNumber || shopNumber.length !== 10) errors.push("Valid 10-digit number required.");
    if (!shopAddress.trim() || addrLen < 10) errors.push("Address required (min 10 chars).");
    else if (addrLen > 200) errors.push("Address max 200 chars.");
    return errors;
  };

  // Map Click Handler (with Bounds Check - Bug Fix)
  const handleMapClick = async (e: any) => {
    let { lngLat } = e;
    const { lng, lat } = lngLat;
    // Clamp to India bounds (Bug Fix)
    const clampedLng = Math.max(68, Math.min(98, lng));
    const clampedLat = Math.max(6, Math.min(38, lat));
    setMarker({ longitude: clampedLng, latitude: clampedLat });
    setViewState({ ...viewState, longitude: clampedLng, latitude: clampedLat, zoom: 15 });
    // Reverse geocode (simulate)
    const address = 'Clamped Address, India'; // Replace with API
    setShopAddress(address);
    checkFormValidity();
    displayStatus('Location selected!', 'success');
  };

  // Optimistic Location (Enhancement 5)
  const handleFindMyLocation = () => {
    if (!navigator.geolocation) {
      displayStatus('Geolocation not supported.', 'error');
      return;
    }
    const optimisticState = { ...viewState, zoom: 14 };
    setViewState(optimisticState); // Optimistic center
    setMarker({ longitude: optimisticState.longitude, latitude: optimisticState.latitude });
    displayStatus('Detecting...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos: GeolocationPosition) => { // TS Fix
        const { longitude, latitude } = pos.coords;
        setMarker({ longitude, latitude });
        setViewState({ longitude, latitude, zoom: 14 });
        displayStatus('Location found!', 'success');
      },
      (err: GeolocationPositionError) => { // TS Fix
        setMarker(null); // Rollback
        displayStatus('Permission denied.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Form Submit with Server Action (Enhancement 1)
  const handleSubmit = async (formData: FormData) => {
    const errors = validateForm();
    if (errors.length > 0) {
      showErrorModal(errors);
      return;
    }
    showLoader();
    try {
      const data = await saveShopProfile(formData);
      if (data.success) {
        hideLoader(); // Fix timing
        setSuccess(true);
        displayStatus('Saved! Redirecting...', 'success');
        const redirectId = data.user?.id || userId;
        // Encoded Redirect (Bug Fix)
        const params = new URLSearchParams();
        if (urlGoogleId) params.set('google_id', urlGoogleId);
        params.set('id', redirectId);
        setTimeout(() => {
          window.location.href = `https://www.krishi.site/dashboard1?${params.toString()}`;
        }, 1200);
      }
    } catch (error) {
      hideLoader();
      displayStatus('Error: ' + (error as Error).message, 'error');
    }
  };

  // Auto-Focus (with Empty Feedback - Bug Fix)
  useEffect(() => {
    if (!shopName.trim()) {
      document.getElementById('shopName')?.focus();
    } else if (!shopAddress.trim()) {
      document.getElementById('shopAddress')?.focus();
    }
  }, [errorModal, shopName, shopAddress]);

  // Success Reset (Bug Fix)
  useEffect(() => {
    return () => setSuccess(false); // Cleanup
  }, []);

  // Validity Check
  useEffect(() => {
    checkFormValidity();
  }, [shopName, shopNumber, shopAddress]);

  const handleShopNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setShopNumber(value);
  };

  // Form Status for Button (Server Action)
  const { pending } = useFormStatus();

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-5 bg-[#0E0E0E] text-white overflow-x-hidden font-['Inter','Noto_Sans_Devanagari',sans-serif] antialiased">
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;700;800;900&display=swap');
          body { font-family: 'Inter', 'Noto Sans Devanagari', sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
          .animate-in { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; }
          .delay-100 { animation-delay: 0.1s; } .delay-200 { animation-delay: 0.2s; } .delay-300 { animation-delay: 0.3s; } .delay-400 { animation-delay: 0.4s; }
          @media (max-width: 480px) { .shop-profile-card { padding: 32px 24px !important; } .shop-profile-title { font-size: 20px !important; } }
          @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
          @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } /* Bug Fix */
          .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
        ` }} />

        <div className="shop-profile-container relative z-30 w-full max-w-[520px] mx-auto">
          <div className="shop-profile-card bg-gradient-to-br from-[#101114] to-[#08090C] rounded-[24px] border border-white/5 p-[40px_32px] relative overflow-hidden mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)] animate-in">
            <div className="shop-profile-content relative z-[2]">
              {/* Header */}
              <div className="shop-profile-header flex items-center justify-center mb-8 gap-3">
                <div className="logo-icon flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#logoGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <defs><linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#9ef87a" /><stop offset="100%" stopColor="#009e57" /></linearGradient></defs>
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                  </svg>
                </div>
                <span className="logo-text text-[28px] font-black bg-gradient-to-br from-[#9ef87a] to-[#009e57] bg-clip-text text-transparent leading-[1]">krishi</span>
              </div>

              <h1 className="shop-profile-title text-center text-[24px] font-bold text-white mb-2">Shop Profile Setup</h1>
              <p className="shop-profile-subtitle text-center text-base text-[#94a3b8] mb-8">Complete your shop details to get started</p>
              <p className="text-center text-sm text-[#64748b] mb-4">Step 2 of 2 — Complete your shop details</p>

              {/* ARIA Live Region (Enhancement 6) */}
              <div aria-live="polite" role="status" className="sr-only">
                {statusMessage?.text || 'Form ready.'}
              </div>

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

              {/* Form with Server Action */}
              <form ref={formRef} action={handleSubmit}>
                <input type="hidden" name="id" value={userId} />
                
                {/* Shop Name (Memo + Feedback - Bug Fix) */}
                <div className="form-group mb-6">
                  <label htmlFor="shopName" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">Shop Name</label>
                  <MemoInput
                    id="shopName"
                    value={shopName}
                    onChange={setShopName}
                    placeholder="e.g., GreenField Agro Mart"
                    minLength={3}
                    maxLength={30}
                    required
                  />
                  {!shopName.trim() && <p className="text-red-400 text-xs mt-1">Shop Name required (min 3 chars)</p>}
                  {shopName.length > 0 && shopName.length < 3 && <p className="text-red-400 text-xs mt-1">Too short (min 3 chars)</p>}
                  {shopName.length >= 3 && shopName.length <= 30 && <p className="text-green-400 text-xs mt-1">✓ Looks good</p>}
                </div>

                {/* Shop Contact Number (Feedback - Bug Fix) */}
                <div className="form-group mb-6">
                  <label htmlFor="shopNumber" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">Shop Contact Number</label>
                  <div className="mobile-input-container flex">
                    <div className="country-code flex items-center px-4 bg-[#141A24] border border-white/10 border-r-0 rounded-l-[12px] text-base text-[#94a3b8]">+91</div>
                    <input
                      type="tel"
                      id="shopNumber"
                      name="shop_number"
                      className="input-field mobile-input flex-1 bg-[#0D1117] border border-white/10 rounded-r-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b]"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      required
                      value={shopNumber}
                      onChange={handleShopNumberChange}
                    />
                  </div>
                  {shopNumber.length > 0 && shopNumber.length !== 10 && <p className="text-red-400 text-xs mt-1">Needs exactly 10 digits</p>}
                  {shopNumber.length === 10 && <p className="text-green-400 text-xs mt-1">✓ Valid number</p>}
                </div>

                {/* Shop Address (Memo + Feedback - Bug Fix) */}
                <div className="form-group mb-6">
                  <label htmlFor="shopAddress" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">Shop Address</label>
                  <MemoTextarea
                    id="shopAddress"
                    name="shop_address"
                    value={shopAddress}
                    onChange={setShopAddress}
                    placeholder="e.g., Near Krishi Market, Main Road, Kolhapur - 416001"
                    maxLength={200}
                    required
                  />
                  {!shopAddress.trim() && <p className="text-red-400 text-xs mt-1">Address required (min 10 chars)</p>}
                  {shopAddress.length > 0 && shopAddress.length < 10 && <p className="text-red-400 text-xs mt-1">Please enter a full address</p>}
                  {shopAddress.length >= 10 && shopAddress.length <= 200 && <p className="text-green-400 text-xs mt-1">✓ Address looks valid</p>}
                  
                  {/* Map (Enhancement 4 - react-map-gl) */}
                  <div className="map-container mt-4 rounded-[12px] overflow-hidden border border-white/10">
                    <Suspense fallback={<div className="h-[200px] animate-pulse bg-gray-800" />}>
                      <Map
                        mapboxAccessToken={MAPBOX_TOKEN}
                        {...viewState}
                        onMove={evt => setViewState(evt.viewState)}
                        mapStyle="mapbox://styles/mapbox/streets-v12"
                        onClick={handleMapClick}
                        aria-label="Shop location selector" // ARIA (Enhancement 6)
                      >
                        {marker && <Marker longitude={marker.longitude} latitude={marker.latitude} color="#10B981" anchor="bottom" />}
                        <NavigationControl />
                      </Map>
                    </Suspense>
                  </div>
                  <button
                    type="button"
                    onClick={handleFindMyLocation}
                    className="mt-3 w-full bg-slate-800/60 hover:bg-slate-800/80 border border-white/10 rounded-[12px] px-4 py-3 text-sm font-semibold text-white transition-all duration-300"
                  >
                    📍 Find My Location
                  </button>
                  <p className="map-instructions text-xs text-[#94a3b8] mt-2 text-center">Click on the map to set your shop location</p>
                  {shopAddress && <p className="text-xs text-center text-[#9ef87a] mt-2">📍 {shopAddress}</p>}
                </div>

                {/* Save Button (with Status) */}
                <button
                  type="submit"
                  className="save-button w-full bg-gradient-to-br from-[#9ef87a] to-[#009e57] text-white border-none rounded-[12px] px-4 py-4 text-base font-semibold transition-all duration-300 shadow-[0_4px_15px_rgba(0,158,87,0.4)] hover:from-[#aefc90] hover:to-[#00b066] hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(0,158,87,0.6)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-[0_4px_15px_rgba(0,158,87,0.4)]"
                  disabled={saveDisabled || pending}
                >
                  {pending ? (
                    <span className="flex items-center justify-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.2s]" />
                      <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.1s]" />
                      <span className="w-2 h-2 bg-white rounded-full animate-bounce" />
                      <span>Saving...</span>
                    </span>
                  ) : 'Save Shop Profile'}
                </button>
              </form>

              <div className="user-id-display text-center text-xs text-[#64748b] mt-6">
                <p>Your User ID: <span id="user-id">{userId}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Overlay */}
      {success && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[9999] text-green-400 text-lg font-semibold animate-fadeIn">
          ✅ Shop Profile Saved!<br />Redirecting to dashboard...
        </div>
      )}

      {/* Error Modal (Shake - Bug Fix) */}
      {errorModal.length > 0 && (
        <div className="modal-backdrop fixed inset-0 bg-black/80 flex justify-center items-center z-50">
          <div className={`modal-content bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 rounded-[16px] p-6 w-[90%] max-w-[400px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] animate-[shake_0.3s_ease-in-out]`}>
            <div className="modal-header flex items-center gap-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3 className="modal-title text-lg font-bold text-white">Validation Error</h3>
            </div>
            <div className="modal-body text-[#94a3b8] mb-6">
              <p>Please fix the following issues:</p>
              <ul className="error-list list-disc ml-5 text-red-400 mt-2">
                {errorModal.map((error, index) => <li key={index}>{error}</li>)}
              </ul>
            </div>
            <button onClick={closeErrorModal} className="modal-button w-full bg-[#1e293b] border border-white/10 rounded-[12px] px-3 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#1e293b]/80">
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Loader */}
      {loading && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999]">
          <span className="loader w-12 h-12 rounded-full inline-block border-t-[3px] border-r-3 border-r-transparent border-[#34d399] box-border animate-[rotation_1s_linear_infinite]" />
        </div>
      )}
    </>
  );
};

const ShopProfilePageWrapper: React.FC = () => (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0E0E0E] text-white">Loading...</div>}>
    <ShopProfilePage />
  </Suspense>
);

export default ShopProfilePageWrapper;
