// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, addDoc, setDoc, doc, getDoc, getDocs, query, where, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

// --- ROUTING HELPER ---
const pageId = document.body.id;

// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = 'normal') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// --- 1. INDEX PAGE (AUTH) ---
if (pageId === 'page-index') {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  // Check if already logged in
  onAuthStateChanged(auth, user => {
    if (user) window.location.href = 'dashboard.html';
  });
  
  // Login Logic
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = loginForm.querySelector('button');
    
    btn.innerText = "Logging in...";
    btn.disabled = true;
    
    signInWithEmailAndPassword(auth, email, password)
      .then(() => window.location.href = 'dashboard.html')
      .catch(err => {
        showToast("Login failed: " + err.message, 'error');
        btn.innerText = "Log In";
        btn.disabled = false;
      });
  });
  
  // Register Logic (With Unique Username Check)
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim().toLowerCase();
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const btn = registerForm.querySelector('button');
    
    // Validation
    if (username.length < 3) return showToast("Username too short", "error");
    
    btn.innerText = "Creating Account...";
    btn.disabled = true;
    
    try {
      // 1. Check if username is taken
      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error("Username already taken. Please choose another.");
      }
      
      // 2. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 3. Save User Data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        username: username,
        email: email,
        createdAt: serverTimestamp()
      });
      
      window.location.href = 'dashboard.html';
      
    } catch (err) {
      showToast(err.message, 'error');
      btn.innerText = "Sign Up";
      btn.disabled = false;
    }
  });
}

// --- 2. DASHBOARD PAGE ---
if (pageId === 'page-dashboard') {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = 'index.html';
    } else {
      // Load User Data
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setupDashboard(user, userData.username);
      } else {
        // Fallback for old users without username documents
        setupDashboard(user, user.uid);
      }
    }
  });
  
  document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = 'index.html');
  });
}

function setupDashboard(user, username) {
  // 1. Avatar
  const avatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${username}`;
  document.getElementById('user-avatar').src = avatarUrl;
  document.getElementById('display-username').textContent = "@" + username;
  document.getElementById('user-email').textContent = user.email;
  
  // 2. Share Link (Using Username)
  const shareUrl = `${window.location.origin}/send.html?u=${username}`;
  const linkInput = document.getElementById('share-link');
  linkInput.value = shareUrl;
  
  // Copy Button
  document.getElementById('copy-btn').addEventListener('click', () => {
    linkInput.select();
    document.execCommand('copy'); // Fallback
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Link copied to clipboard!', 'success');
    });
  });
  
  // 3. Listen for Messages
  const q = query(
    collection(db, "messages"),
    where("receiverId", "==", user.uid),
    orderBy("timestamp", "desc")
  );
  
  onSnapshot(q, (snapshot) => {
    const list = document.getElementById('messages-list');
    list.innerHTML = '';
    
    if (snapshot.empty) {
      list.innerHTML = '<p class="empty-msg">No messages yet. Share your link! 👻</p>';
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

// --- 3. SEND PAGE ---
if (pageId === 'page-send') {
  const params = new URLSearchParams(window.location.search);
  const targetUsername = params.get('u'); // Getting username from URL
  let targetUid = null;
  
  if (!targetUsername) {
    alert("Invalid Link");
    window.location.href = 'index.html';
  }
  
  // Initialize Page
  (async function initSendPage() {
    try {
      // Find UID based on username
      const q = query(collection(db, "users"), where("username", "==", targetUsername));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        document.querySelector('.container').innerHTML = "<h2>User not found 😕</h2><p><a href='index.html'>Go Home</a></p>";
        return;
      }
      
      // Get the first matching doc (should be unique)
      const userDoc = querySnapshot.docs[0];
      targetUid = userDoc.id;
      
      // Update UI
      document.getElementById('target-username').textContent = "@" + targetUsername;
      document.getElementById('target-avatar').src = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${targetUsername}`;
      
    } catch (error) {
      console.error("Error fetching user:", error);
      showToast("Error loading user profile", "error");
    }
  })();
  
  // Character Count
  const textarea = document.getElementById('msg-text');
  textarea.addEventListener('input', () => {
    document.getElementById('chars').innerText = textarea.value.length;
  });
  
  // Send Logic
  document.getElementById('msg-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    const btn = e.target.querySelector('button');
    
    if (!text || !targetUid) return;
    
    btn.disabled = true;
    btn.innerText = "Sending...";
    
    try {
      await addDoc(collection(db, "messages"), {
        text: text,
        receiverId: targetUid, // We send to UID, not username
        timestamp: serverTimestamp()
      });
      
      document.getElementById('msg-form').classList.add('hidden');
      document.getElementById('success-message').classList.remove('hidden');
      showToast("Message sent anonymously!", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to send message.", "error");
      btn.disabled = false;
      btn.innerText = "Send Anonymously 🚀";
    }
  });
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}