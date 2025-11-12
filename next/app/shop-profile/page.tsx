'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const BACKEND_URL = 'https://api.krishi.site';
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGlwZXNoNjM2NiIsImEiOiJjbWhraTZ1ZGgwYTFxMmlzYzdxcGlibzJnIn0.B62FIHq1WSsXbl_xcag-QA';

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
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);

  // URL params
  const searchParams = useSearchParams();
  const urlUserId = searchParams.get('id') || '';
  const urlGoogleId = searchParams.get('google_id') || '';

  useEffect(() => {
    setUserId(urlUserId);
    // Store user ID for dashboard use
    if (urlUserId) {
      localStorage.setItem('user_id', urlUserId);
      sessionStorage.setItem('user_id', urlUserId);
      console.log("✅ USER_ID stored for dashboard:", urlUserId);
    }
  }, [urlUserId]);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  const displayStatus = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const checkFormValidity = () => {
    const isValid = shopName.trim() && 
                   shopNumber.length === 10 && 
                   shopAddress.trim();
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
    if (!shopName.trim()) errors.push("Shop Name is required.");
    if (!shopNumber || shopNumber.length !== 10) {
      errors.push("Valid 10-digit shop contact number is required.");
    }
    if (!shopAddress.trim()) errors.push("Shop Address is required.");
    return errors;
  };

  // Mapbox Functions
  const initMap = async () => {
    if (typeof window === 'undefined' || !(window as any).mapboxgl) return;

    const mapboxgl = (window as any).mapboxgl;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Default center (India)
    const defaultCenter = [78.9629, 20.5937];
    const defaultZoom = 4;

    // Create the map
    const newMap = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: defaultCenter,
      zoom: defaultZoom
    });

    newMap.addControl(new mapboxgl.NavigationControl());

    // Wait until map fully loads before geolocation
    newMap.on('load', () => {
      console.log('🗺️ Map fully loaded, requesting location...');

      if (navigator.geolocation) {
        const success = (position: GeolocationPosition) => {
          const userLng = position.coords.longitude;
          const userLat = position.coords.latitude;
          console.log('✅ Got location:', userLat, userLng, 'accuracy ±', position.coords.accuracy, 'm');

          newMap.flyTo({ center: [userLng, userLat], zoom: 14 });
          const newMarker = new mapboxgl.Marker({ color: "#10B981" })
            .setLngLat([userLng, userLat])
            .addTo(newMap);
          setMarker(newMarker);

          displayStatus('Location found! Adjust marker near your shop.', 'success');
        };

        const error = (err: GeolocationPositionError) => {
          console.warn('⚠️ Location error:', err);
          displayStatus('Could not access location. Please click on map to set shop.', 'error');
        };

        // Try high accuracy first, fallback to low accuracy if it fails
        navigator.geolocation.getCurrentPosition(
          success,
          (err) => {
            console.warn('High accuracy failed, retrying low accuracy...');
            navigator.geolocation.getCurrentPosition(success, error, {
              enableHighAccuracy: false,
              timeout: 30000
            });
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        displayStatus('Geolocation not supported on this device.', 'error');
      }
    });

    // Handle manual map click to set shop position
    newMap.on('click', async (e: any) => {
  const coords = e.lngLat;

  // 🔹 Remove existing marker (ensures only one)
  if (marker) {
    marker.remove();
  }

  // 🔹 Add new marker at clicked position
  const newMarker = new mapboxgl.Marker({ color: "#10B981" })
    .setLngLat(coords)
    .addTo(newMap);

  setMarker(newMarker);

  // 🔹 Reverse geocode to fetch readable address
  const address = await reverseGeocode(coords.lng, coords.lat);
  setShopAddress(address);
  checkFormValidity();
  displayStatus('Shop location selected!', 'success');
});

    setMap(newMap);
  };

  const reverseGeocode = async (lng: number, lat: number): Promise<string> => {
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=en`);
      const data = await res.json();
      if (data.features.length > 0) {
        return formatAddress(data.features[0]);
      }
      return 'Address not found';
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      return 'Address lookup failed';
    }
  };

  const formatAddress = (item: any): string => {
    const placeName = item.place_name || item.text || '';
    const address = item.address || '';
    const postcode = item.postcode ? ` ${item.postcode}` : '';
    const context = item.context ? item.context.map((c: any) => c.text).join(', ') : '';
    return `${placeName}${address ? ', ' + address : ''}${postcode}, ${context}`.trim();
  };

  const geocodeExistingAddress = async (address: string) => {
    if (!address || !map) return;
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=IN&language=en&limit=1`);
      const data = await res.json();
      if (data.features.length > 0) {
        const coords = data.features[0].center;
        map.flyTo({ center: coords, zoom: 15 });
        if (marker) marker.remove();
        const newMarker = new (window as any).mapboxgl.Marker().setLngLat(coords).addTo(map);
        setMarker(newMarker);
      }
    } catch (err) {
      console.error('Geocoding existing address failed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      showErrorModal(errors);
      return;
    }

    showLoader();

    const payload = {
      id: userId,
      shop_name: shopName.trim(),
      shop_number: shopNumber.replace(/[^0-9]/g, ''),
      shop_address: shopAddress.trim()
    };

    console.log('Saving shop profile with payload:', payload);

    try {
      const res = await fetch(`${BACKEND_URL}/save-shop-profile`, {
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
      
      console.log('Save shop profile response:', data);
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      if (data.success) {
        displayStatus('Shop profile saved successfully! Redirecting...', 'success');
        const redirectId = data.user?.id || userId;
        
        setTimeout(() => {
          const googleParam = urlGoogleId ? `google_id=${urlGoogleId}&` : '';
          window.location.href = `https://www.krishi.site/dashboard1?${googleParam}id=${redirectId}`;
        }, 1200);
      } else {
        throw new Error(data.error || 'Shop profile save failed');
      }
    } catch (error) {
      console.error("Error updating shop profile:", error);
      displayStatus('Error updating shop profile: ' + (error as Error).message, 'error');
    } finally {
      hideLoader();
    }
  };

  // Load profile data
  const loadProfile = async () => {
    if (!userId || userId === 'Loading...') return;

    showLoader();
    const payload = { id: userId };

    try {
      const res = await fetch(`${BACKEND_URL}/get-user-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const responseText = await res.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse profile response as JSON:', responseText);
        throw new Error('Server returned invalid response');
      }
      
      if (!res.ok || !data.success || !data.user) {
        throw new Error(data.error || 'Shop profile not found');
      }
      
      const user = data.user;
      setShopName(user.shop_name || '');
      setShopNumber(user.shop_number || '');
      setShopAddress(user.shop_address || '');
      
      // Geocode existing address on map after init
      setTimeout(() => geocodeExistingAddress(user.shop_address || ''), 1000);
      checkFormValidity();
    } catch (error) {
      console.error("Error loading shop profile:", error);
      displayStatus('Failed to load shop profile: ' + (error as Error).message, 'error');
    }
    hideLoader();
  };

  // Initialize Mapbox
  useEffect(() => {
    const loadMapbox = async () => {
      if (typeof window !== 'undefined') {
        // Load Mapbox CSS
        if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css';
          document.head.appendChild(link);
        }

        // Load Mapbox JS
        if (!(window as any).mapboxgl) {
          const script = document.createElement('script');
          script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js';
          script.async = true;
          script.onload = () => {
            initMap();
            loadProfile();
          };
          document.head.appendChild(script);
        } else {
          initMap();
          loadProfile();
        }
      }
    };

    loadMapbox();
  }, []);

  // Check form validity on changes
  useEffect(() => {
    checkFormValidity();
  }, [shopName, shopNumber, shopAddress]);

  const handleShopNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setShopNumber(value);
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

          

          .animate-in {
            animation: fadeInUp 0.8s ease-out forwards;
            opacity: 0;
          }

          .delay-100 { animation-delay: 0.1s; }
          .delay-200 { animation-delay: 0.2s; }
          .delay-300 { animation-delay: 0.3s; }
          .delay-400 { animation-delay: 0.4s; }

          @media (max-width: 480px) {
            .shop-profile-card { padding: 32px 24px !important; }
            .shop-profile-title { font-size: 20px !important; }
          }
        ` }} />

        {/* Background Effects */}
        

        <div className="shop-profile-container relative z-30 w-full max-w-[520px] mx-auto">
          <div className="shop-profile-card bg-gradient-to-br from-[#101114] to-[#08090C] rounded-[24px] border border-white/5 p-[40px_32px] relative overflow-hidden mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="shop-profile-content relative z-[2]">
              {/* Header */}
              <div className="shop-profile-header flex items-center justify-center mb-8 gap-3">
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
              <h1 className="shop-profile-title text-center text-[24px] font-bold text-white mb-2">Shop Profile Setup</h1>
              <p className="shop-profile-subtitle text-center text-base text-[#94a3b8] mb-8">Complete your shop details to get started</p>

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

              {/* Shop Profile Form */}
              <form onSubmit={handleSubmit}>
                
{/* Shop Name */}
<div className="form-group mb-6">
  <label htmlFor="shopName" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">
    Shop Name
  </label>
  <input
    type="text"
    id="shopName"
    className="input-field w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b]"
    placeholder="Enter your shop name"
    maxLength={30}   // 🔹 changed from 100 to 30
    required
    value={shopName}
    onChange={(e) => setShopName(e.target.value)}
  />
  <p className="text-xs text-[#64748b] mt-1 text-right">
    {shopName.length}/30
  </p>
</div>


                {/* Shop Contact Number */}
                <div className="form-group mb-6">
                  <label htmlFor="shopNumber" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">
                    Shop Contact Number
                  </label>
                  <div className="mobile-input-container flex">
                    <div className="country-code flex items-center px-4 bg-[#141A24] border border-white/10 border-r-0 rounded-l-[12px] text-base text-[#94a3b8]">
                      +91
                    </div>
                    <input
                      type="tel"
                      id="shopNumber"
                      className="input-field mobile-input flex-1 bg-[#0D1117] border border-white/10 rounded-r-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b]"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      required
                      value={shopNumber}
                      onChange={handleShopNumberChange}
                    />
                  </div>
                </div>

                {/* Shop Address */}
<div className="form-group mb-6">
  <label htmlFor="shopAddress" className="input-label block text-sm font-semibold text-[#94a3b8] mb-2">
    Shop Address
  </label>
  <textarea
    id="shopAddress"
    className="input-field textarea-field w-full bg-[#0D1117] border border-white/10 rounded-[12px] px-4 py-4 text-base text-white transition-all duration-300 focus:outline-none focus:border-[#9ef87a]/50 focus:ring-2 focus:ring-[#9ef87a]/20 placeholder:text-[#64748b] min-h-[100px] resize-vertical"
    placeholder="Full shop address (street, city, pincode, etc.)"
    rows={3}
    maxLength={200}  // 🔹 changed from 500 to 200
    required
    value={shopAddress}
    onChange={(e) => setShopAddress(e.target.value)}
  />
  <p className="text-xs text-[#64748b] mt-1 text-right">
    {shopAddress.length}/200
  </p>

  {/* Map Container */}
  <div className="map-container mt-4 rounded-[12px] overflow-hidden border border-white/10">
    <div id="map" className="h-[200px] w-full" />
  </div>
  <p className="map-instructions text-xs text-[#94a3b8] mt-2 text-center">
    Click on the map to set your shop location
  </p>
</div>

                {/* Save Button */}
                <button
                  type="submit"
                  id="save-button"
                  className="save-button w-full bg-gradient-to-br from-[#9ef87a] to-[#009e57] text-white border-none rounded-[12px] px-4 py-4 text-base font-semibold transition-all duration-300 shadow-[0_4px_15px_rgba(0,158,87,0.4)] hover:from-[#aefc90] hover:to-[#00b066] hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(0,158,87,0.6)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-[0_4px_15px_rgba(0,158,87,0.4)]"
                  disabled={saveDisabled || loading}
                >
                  {loading ? 'Saving...' : 'Save Shop Profile'}
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
                {errorModal.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
            <button 
              onClick={closeErrorModal}
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

// Wrap with Suspense for useSearchParams
const ShopProfilePageWrapper: React.FC = () => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0E0E0E] text-white">Loading...</div>}>
      <ShopProfilePage />
    </Suspense>
  );
};

export default ShopProfilePageWrapper;
