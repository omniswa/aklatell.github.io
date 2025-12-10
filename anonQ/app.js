// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBMxV7RKFBLSZaZMWIjnY54izDrrY2R5vI",
  authDomain: "anonq-app.firebaseapp.com",
  projectId: "anonq-app",
  storageBucket: "anonq-app.firebasestorage.app",
  messagingSenderId: "490833512418",
  appId: "1:490833512418:web:c8e43e4e6d090b5a579bbb",
  measurementId: "G-8TQYXDS7BL"
};

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM ELEMENTS & ROUTING ---
const path = window.location.pathname;
const isDashboard = path.includes('dashboard.html');
const isSend = path.includes('send.html');
const isIndex = path.includes('index.html') || path === '/';

// --- AUTHENTICATION LOGIC (Index.html) ---
if (isIndex) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  // Login
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    signInWithEmailAndPassword(auth, email, password)
      .then(() => window.location.href = 'dashboard.html')
      .catch(err => alert("Login failed: " + err.message));
  });
  
  // Register
  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => window.location.href = 'dashboard.html')
      .catch(err => alert("Error: " + err.message));
  });
  
  // Redirect if already logged in
  onAuthStateChanged(auth, user => {
    if (user) window.location.href = 'dashboard.html';
  });
}

// --- DASHBOARD LOGIC (dashboard.html) ---
if (isDashboard) {
  onAuthStateChanged(auth, user => {
    if (!user) {
      window.location.href = 'index.html';
    } else {
      setupDashboard(user);
    }
  });
  
  document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = 'index.html');
  });
}

function setupDashboard(user) {
  // 1. Generate Avatar (using DiceBear API for neutral avatars)
  const avatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user.uid}`;
  document.getElementById('user-avatar').src = avatarUrl;
  document.getElementById('user-email').textContent = user.email;
  
  // 2. Setup Share Link
  // We assume the file is hosted at the current origin
  const shareUrl = `${window.location.origin}/send.html?uid=${user.uid}`;
  const linkInput = document.getElementById('share-link');
  linkInput.value = shareUrl;
  
  // Copy Button
  document.getElementById('copy-btn').addEventListener('click', () => {
    linkInput.select();
    document.execCommand('copy');
    alert('Link copied to clipboard!');
  });
  
  // 3. Listen for Messages
  const q = query(
    collection(db, "messages"),
    where("receiverId", "==", user.uid),
    orderBy("timestamp", "desc")
  );
  
  onSnapshot(q, (snapshot) => {
    const list = document.getElementById('messages-list');
    list.innerHTML = ''; // Clear loading/old data
    
    if (snapshot.empty) {
      list.innerHTML = '<p class="empty-msg">No messages yet. Share your link!</p>';
      return;
    }
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const date = data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Just now';
      
      const msgDiv = document.createElement('div');
      msgDiv.className = 'message-card';
      msgDiv.innerHTML = `
                <p>${escapeHtml(data.text)}</p>
                <span class="timestamp">${date}</span>
            `;
      list.appendChild(msgDiv);
    });
  });
}

// --- SENDING LOGIC (send.html) ---
if (isSend) {
  const params = new URLSearchParams(window.location.search);
  const targetUid = params.get('uid');
  
  if (!targetUid) {
    alert("Invalid Link");
    window.location.href = 'index.html';
  }
  
  // Load Target User Info (Avatar only to keep anonymity)
  const avatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${targetUid}`;
  document.getElementById('target-avatar').src = avatarUrl;
  
  // Character Count
  const textarea = document.getElementById('msg-text');
  textarea.addEventListener('input', () => {
    document.getElementById('chars').innerText = textarea.value.length;
  });
  
  // Send Message
  document.getElementById('msg-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    const btn = e.target.querySelector('button');
    
    if (!text) return;
    
    btn.disabled = true;
    btn.innerText = "Sending...";
    
    try {
      await addDoc(collection(db, "messages"), {
        text: text,
        receiverId: targetUid,
        timestamp: serverTimestamp()
      });
      
      document.getElementById('msg-form').classList.add('hidden');
      document.getElementById('success-message').classList.remove('hidden');
    } catch (error) {
      console.error(error);
      alert("Failed to send message.");
      btn.disabled = false;
      btn.innerText = "Send Anonymously";
    }
  });
}

// XSS Prevention Helper
function escapeHtml(text) {
  if (!text) return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}