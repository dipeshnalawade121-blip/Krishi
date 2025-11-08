export async function initUI(){
  const BACKEND_URL = 'https://api.krishi.site';

  // Loader helpers
  function showLoader(){
    const loader = document.getElementById('loader-overlay');
    loader.style.display = 'flex';
    loader.style.opacity = '1';
  }
  function hideLoader(){
    const loader = document.getElementById('loader-overlay');
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 300);
  }

  const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGlwZXNoNjM2NiIsImEiOiJjbWhraTZ1ZGgwYTFxMmlzYzdxcGlibzJnIn0.B62FIHq1WSsXbl_xcag-QA';

  // URL + fields
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  document.getElementById('user-id').textContent = userId || 'N/A';

  const form = document.getElementById('profile-form');
  const saveButton = document.getElementById('save-button');
  const statusMessage = document.getElementById('status-message');

  const errorModal = document.getElementById('error-modal');
  const modalErrorList = document.getElementById('modal-error-list');
  const closeModalButton = document.getElementById('close-modal-button');

  const inputShopName = document.getElementById('shopName');
  const inputShopNumber = document.getElementById('shopNumber');
  const inputShopAddress = document.getElementById('shopAddress');

  let map, marker;

  function displayStatus(message, type){
    statusMessage.textContent = message;
    statusMessage.className =
      `p-3 mb-6 rounded-lg text-sm transition-all duration-300 ${
        type==='success' ? 'bg-green-900 text-green-300' :
        type==='error'   ? 'bg-red-900 text-red-300'   :
                           'bg-blue-900 text-blue-300'}`
    statusMessage.classList.remove('hidden');
    setTimeout(() => statusMessage.classList.add('hidden'), 5000);
  }

  function checkFormValidity(){
    const isValid = inputShopName.value.trim() &&
                    inputShopNumber.value.length === 10 &&
                    inputShopAddress.value.trim();
    saveButton.disabled = !isValid;
  }

  function showModal(messages){
    modalErrorList.innerHTML = messages.map(m => `<li>${m}</li>`).join('');
    errorModal.style.display = 'flex';
  }
  function closeModal(){
    errorModal.style.display = 'none';
  }
  closeModalButton.addEventListener('click', closeModal);

  function validateForm(){
    const errors = [];
    if(!inputShopName.value.trim()) errors.push('Shop Name is required.');
    if(!inputShopNumber.value || inputShopNumber.value.length !== 10) errors.push('Valid 10-digit shop contact number is required.');
    if(!inputShopAddress.value.trim()) errors.push('Shop Address is required.');
    return errors;
  }

  async function reverseGeocode(lng, lat){
    try{
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=en`);
      const data = await res.json();
      if(data.features.length > 0) return formatAddress(data.features[0]);
      return 'Address not found';
    }catch(e){
      console.error('Reverse geocoding failed:', e);
      return 'Address lookup failed';
    }
  }

  function formatAddress(item){
    const placeName = item.place_name || item.text || '';
    const address = item.address || '';
    const postcode = item.postcode ? ` ${item.postcode}` : '';
    const context = item.context ? item.context.map(c => c.text).join(', ') : '';
    return `${placeName}${address ? ', ' + address : ''}${postcode}, ${context}`.trim();
  }

  async function geocodeExistingAddress(address){
    if(!address) return;
    try{
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=IN&language=en&limit=1`);
      const data = await res.json();
      if(data.features.length > 0){
        const coords = data.features[0].center;
        map.flyTo({ center: coords, zoom: 15 });
        if(marker) marker.remove();
        marker = new mapboxgl.Marker({ color: "#10B981" }).setLngLat(coords).addTo(map);
      }
    }catch(err){
      console.error('Geocoding existing address failed:', err);
    }
  }

  async function initMap(){
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Default center (India)
    const defaultCenter = [78.9629, 20.5937];
    const defaultZoom = 4;

    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: defaultCenter,
      zoom: defaultZoom
    });

    map.addControl(new mapboxgl.NavigationControl());

    map.on('load', () => {
      if(navigator.geolocation){
        const success = (pos) => {
          const { longitude: lng, latitude: lat, accuracy } = pos.coords;
          console.log('✅ location', lat, lng, '±', accuracy, 'm');
          map.flyTo({ center: [lng, lat], zoom: 14 });
          marker = new mapboxgl.Marker({ color: "#10B981" }).setLngLat([lng, lat]).addTo(map);
          displayStatus('Location found! Adjust marker near your shop.', 'success');
        };
        const error = (err) => {
          console.warn('⚠️ geolocation error:', err);
          displayStatus('Could not access location. Please click on map to set shop.', 'error');
        };
        navigator.geolocation.getCurrentPosition(
          success,
          () => {
            navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy:false, timeout:30000 });
          },
          { enableHighAccuracy:true, timeout:10000 }
        );
      }else{
        displayStatus('Geolocation not supported on this device.', 'error');
      }
    });

    // Manual select
    map.on('click', async (e) => {
      const coords = e.lngLat;
      if(marker) marker.remove();
      marker = new mapboxgl.Marker({ color: "#10B981" }).setLngLat(coords).addTo(map);
      const address = await reverseGeocode(coords.lng, coords.lat);
      inputShopAddress.value = address;
      checkFormValidity();
      displayStatus('Shop location selected!', 'success');
    });
  }

  async function saveProfile(event){
    event.preventDefault();
    const errors = validateForm();
    if(errors.length > 0){ showModal(errors); return; }

    saveButton.disabled = true;
    saveButton.textContent = 'Updating...';
    showLoader();

    const payload = {
      id: new URLSearchParams(window.location.search).get('id'),
      shop_name: inputShopName.value.trim(),
      shop_number: inputShopNumber.value.replace(/[^0-9]/g, ''),
      shop_address: inputShopAddress.value.trim()
    };

    try{
      const res = await fetch(`${BACKEND_URL}/save-shop-profile`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let data;
      try{ data = JSON.parse(text); }
      catch{ throw new Error(`Server returned invalid response: ${text.substring(0,100)}`); }

      if(!res.ok) throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);

      if(data.success){
        displayStatus('Shop profile saved successfully! Redirecting...', 'success');
        const redirectId = data.user?.id || payload.id;
        const googleId = new URLSearchParams(window.location.search).get('google_id');
        setTimeout(() => {
          const googleParam = googleId ? `google_id=${googleId}&` : '';
          window.location.href = `https://www.krishi.site/dashboard?${googleParam}id=${redirectId}`;
        }, 1200);
      }else{
        throw new Error(data.error || 'Shop profile save failed');
      }
    }catch(err){
      console.error('Error updating shop profile:', err);
      displayStatus('Error updating shop profile: ' + err.message, 'error');
      hideLoader();
    }finally{
      saveButton.disabled = false;
      saveButton.textContent = 'Save Shop Profile';
    }
  }

  async function loadProfile(){
    const id = userId;
    if(!id){ displayStatus('No user ID found for profile lookup.', 'error'); return; }
    try{
      const res = await fetch(`${BACKEND_URL}/get-user-profile`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ id })
      });
      const txt = await res.text();
      let data;
      try{ data = JSON.parse(txt); }
      catch{ throw new Error('Server returned invalid response'); }

      if(!res.ok || !data.success || !data.user) throw new Error(data.error || 'Shop profile not found');

      const user = data.user;
      inputShopName.value = user.shop_name || '';
      inputShopNumber.value = user.shop_number || '';
      inputShopAddress.value = user.shop_address || '';

      setTimeout(() => geocodeExistingAddress(user.shop_address), 600);
      checkFormValidity();
    }catch(err){
      console.error('Error loading shop profile:', err);
      displayStatus('Failed to load shop profile: ' + err.message, 'error');
    }
  }

  // Events
  inputShopNumber.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    checkFormValidity();
  });
  inputShopName.addEventListener('input', checkFormValidity);
  inputShopAddress.addEventListener('input', checkFormValidity);
  form.addEventListener('submit', saveProfile);

  // Init
  await initMap();
  await loadProfile();
  displayStatus('Shop profile ready with map!', 'success');
  // lucide icons
  window.lucide?.createIcons();
}
