// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7s02po42gQ-frJT2G6wfvGa-zLysTAVQ",
  authDomain: "myotpapp-50067.firebaseapp.com",
  projectId: "myotpapp-50067",
  storageBucket: "myotpapp-50067.firebasestorage.app",
  messagingSenderId: "489896198277",
  appId: "1:489896198277:web:c911e919fc7b59556c69ec",
  measurementId: "G-FTY81KQE5S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Recaptcha Verifiers
window.regVerifier = new RecaptchaVerifier('reg-recaptcha-container', {
  'size': 'invisible'
}, auth);
window.loginVerifier = new RecaptchaVerifier('login-recaptcha-container', {
  'size': 'invisible'
}, auth);

window.regVerifier.render();
window.loginVerifier.render();

window.regConfirmation = null;
window.loginConfirmation = null;
window.regVerified = false;
window.loginVerified = false;

const regOriginalClass = 'w-2/5 bg-green-100 text-green-700 font-semibold rounded-xl hover:bg-green-200 transition';
const loginOriginalClass = 'w-2/5 bg-green-100 text-green-700 font-semibold rounded-xl hover:bg-green-200 transition';

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function startCountdown(btn, seconds, originalText, originalClass, intervalKey, confirmationVar) {
  if (window[intervalKey]) {
    clearInterval(window[intervalKey]);
  }
  btn.disabled = true;
  const timerSpan = document.createElement('span');
  timerSpan.id = 'timer-span';
  timerSpan.className = 'ml-1 font-medium';
  btn.innerHTML = 'OTP sent successfully! ';
  btn.appendChild(timerSpan);
  timerSpan.innerHTML = formatTime(seconds);
  btn.className = 'w-2/5 flex items-center justify-center rounded-xl bg-blue-100 text-blue-700 text-sm font-medium border border-blue-300 p-1';
  let timeLeft = seconds;
  window[intervalKey] = setInterval(() => {
    timeLeft--;
    timerSpan.innerHTML = formatTime(timeLeft);
    if (timeLeft < 0) {
      clearInterval(window[intervalKey]);
      delete window[intervalKey];
      btn.innerHTML = originalText;
      btn.className = originalClass;
      btn.disabled = false;
      window[confirmationVar] = null;
    }
  }, 1000);
}

// Registration Send OTP
document.getElementById('reg-send-otp').addEventListener('click', async () => {
  const phoneInput = document.getElementById('reg-mobile').value.replace(/[^0-9]/g, '');
  if (phoneInput.length !== 10) {
    alert('Please enter a valid 10-digit mobile number.');
    return;
  }
  if (window.regConfirmation) {
    return;
  }
  const phoneNumber = '+91' + phoneInput;
  const sendBtn = document.getElementById('reg-send-otp');
  try {
    window.regConfirmation = await signInWithPhoneNumber(auth, phoneNumber, window.regVerifier);
    startCountdown(sendBtn, 119, 'Get OTP', regOriginalClass, 'regInterval', 'regConfirmation');
    alert('OTP sent to your mobile!');
  } catch (error) {
    console.error(error);
    alert('Error sending OTP: ' + error.message);
  }
});

// Registration OTP Input Listener
document.getElementById('reg-otp').addEventListener('input', (e) => {
  const value = e.target.value;
  const verifyBtn = document.getElementById('reg-verify-btn');
  if (window.regConfirmation && value.length === 6 && /^\d{6}$/.test(value)) {
    verifyBtn.disabled = false;
  } else {
    verifyBtn.disabled = true;
  }
});

// Registration Verify OTP
document.getElementById('reg-verify-btn').addEventListener('click', async () => {
  const code = document.getElementById('reg-otp').value;
  if (!window.regConfirmation) return;
  try {
    const result = await window.regConfirmation.confirm(code);
    const verifyBtn = document.getElementById('reg-verify-btn');
    verifyBtn.innerHTML = 'Verified <i data-lucide="check" class="w-3 h-3 ml-1"></i>';
    verifyBtn.className = 'w-2/5 flex items-center justify-center rounded-xl bg-green-100 text-green-700 text-sm font-medium border border-green-300';
    verifyBtn.disabled = true;
    document.getElementById('reg-otp').disabled = true;
    document.getElementById('reg-otp').value = '';
    lucide.createIcons();
    alert('Phone number verified successfully!');
    window.regVerified = true;
    console.log('Verified user:', result.user);
  } catch (error) {
    console.error(error);
    alert('Invalid OTP. Please try again.');
    document.getElementById('reg-otp').value = '';
    document.getElementById('reg-verify-btn').disabled = true;
  }
});

// Registration Form Submit
document.getElementById('registration-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!window.regVerified) {
    alert('Please verify your phone number first.');
    return;
  }
  const pw1 = document.getElementById('reg-password').value;
  const pw2 = document.getElementById('reg-password-confirm').value;
  if (pw1.length < 6 || pw1 !== pw2) {
    alert('Passwords must match and be at least 6 characters.');
    return;
  }
  alert('Account created successfully! Welcome to Krishi.');
  resetRegistration();
  closeModal('registration-modal');
});

// Login Send OTP
document.getElementById('login-send-otp').addEventListener('click', async () => {
  const phoneInput = document.getElementById('login-mobile').value.replace(/[^0-9]/g, '');
  if (phoneInput.length !== 10) {
    alert('Please enter a valid 10-digit mobile number.');
    return;
  }
  if (window.loginConfirmation) {
    return;
  }
  const phoneNumber = '+91' + phoneInput;
  const sendBtn = document.getElementById('login-send-otp');
  try {
    window.loginConfirmation = await signInWithPhoneNumber(auth, phoneNumber, window.loginVerifier);
    startCountdown(sendBtn, 119, 'Get New OTP', loginOriginalClass, 'loginInterval', 'loginConfirmation');
    document.getElementById('login-verify-btn').style.display = 'block';
    alert('OTP sent to your mobile!');
  } catch (error) {
    console.error(error);
    alert('Error sending OTP: ' + error.message);
  }
});

// Login OTP Input Listener
document.getElementById('login-otp').addEventListener('input', (e) => {
  const value = e.target.value;
  const verifyBtn = document.getElementById('login-verify-btn');
  if (window.loginConfirmation && value.length === 6 && /^\d{6}$/.test(value)) {
    verifyBtn.disabled = false;
  } else {
    verifyBtn.disabled = true;
  }
});

// Login Verify OTP
document.getElementById('login-verify-btn').addEventListener('click', async () => {
  const code = document.getElementById('login-otp').value;
  if (!window.loginConfirmation) return;
  try {
    const result = await window.loginConfirmation.confirm(code);
    const verifyBtn = document.getElementById('login-verify-btn');
    verifyBtn.innerHTML = 'Verified <i data-lucide="check" class="w-3 h-3 ml-1"></i>';
    verifyBtn.className = 'w-full py-3 flex items-center justify-center rounded-xl bg-green-100 text-green-700 font-semibold border border-green-300';
    verifyBtn.disabled = true;
    document.getElementById('login-otp').disabled = true;
    document.getElementById('login-otp').value = '';
    lucide.createIcons();
    alert('Phone number verified successfully!');
    window.loginVerified = true;
    console.log('Verified user:', result.user);
  } catch (error) {
    console.error(error);
    alert('Invalid OTP. Please try again.');
    document.getElementById('login-otp').value = '';
    document.getElementById('login-verify-btn').disabled = true;
  }
});

// Login Form Submit
document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const pw = document.getElementById('login-password').value;
  if (pw || window.loginVerified) {
    alert('Logged in successfully!');
    resetLogin();
    closeModal('login-modal');
  } else {
    alert('Enter password or verify OTP.');
  }
});

lucide.createIcons();
        
// Function to open the specified modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scrolling the background
}

// Function to close the specified modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scrolling
    if (modalId === 'registration-modal') {
        resetRegistration();
    } else if (modalId === 'login-modal') {
        resetLogin();
    }
}

// Handle ESC key to close modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal('registration-modal');
        closeModal('login-modal');
    }
});

function resetRegistration() {
    document.getElementById('registration-form').reset();
    const sendBtn = document.getElementById('reg-send-otp');
    sendBtn.textContent = 'Get OTP';
    sendBtn.className = 'w-2/5 bg-green-100 text-green-700 font-semibold rounded-xl hover:bg-green-200 transition';
    sendBtn.disabled = false;
    const verifyBtn = document.getElementById('reg-verify-btn');
    verifyBtn.innerHTML = 'Verify OTP';
    verifyBtn.className = 'w-2/5 bg-blue-100 text-blue-700 font-semibold rounded-xl hover:bg-blue-200 transition';
    verifyBtn.disabled = true;
    document.getElementById('reg-otp').disabled = false;
    if (window.regInterval) {
        clearInterval(window.regInterval);
        delete window.regInterval;
    }
    window.regConfirmation = null;
    window.regVerified = false;
}

function resetLogin() {
    document.getElementById('login-form').reset();
    const sendBtn = document.getElementById('login-send-otp');
    sendBtn.textContent = 'Get New OTP';
    sendBtn.className = 'w-2/5 bg-green-100 text-green-700 font-semibold rounded-xl hover:bg-green-200 transition';
    sendBtn.disabled = false;
    const verifyBtn = document.getElementById('login-verify-btn');
    verifyBtn.style.display = 'none';
    verifyBtn.innerHTML = 'Verify OTP';
    verifyBtn.className = 'w-full py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 disabled:bg-gray-400 transition';
    verifyBtn.disabled = true;
    document.getElementById('login-otp').disabled = false;
    if (window.loginInterval) {
        clearInterval(window.loginInterval);
        delete window.loginInterval;
    }
    window.loginConfirmation = null;
    window.loginVerified = false;
}
