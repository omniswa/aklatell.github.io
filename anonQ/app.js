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
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// --- USERNAME VALIDATION ---
function isValidUsername(username) {
  // Only lowercase letters, numbers, and underscores
  const usernameRegex = /^[a-z0-9_]+$/;
  return usernameRegex.test(username) && username.length >= 4 && username.length <= 14;
}

// Reserved usernames to prevent conflicts
const RESERVED_USERNAMES = ['admin', 'system', 'anonq', 'support', 'help', 'moderator', 'root', 'mod'];

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
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = loginForm.querySelector('button');
    
    btn.innerText = "Logging in...";
    btn.disabled = true;
    
    signInWithEmailAndPassword(auth, email, password)
      .then(() => window.location.href = 'dashboard.html')
      .catch(err => {
        let errorMessage = "Login failed. Please check your credentials.";
        if (err.code === 'auth/user-not-found') {
          errorMessage = "No account found with this email.";
        } else if (err.code === 'auth/wrong-password') {
          errorMessage = "Incorrect password.";
        } else if (err.code === 'auth/invalid-email') {
          errorMessage = "Invalid email address.";
        } else if (err.code === 'auth/invalid-credential') {
          errorMessage = "Invalid email or password.";
        }
        showToast(errorMessage, 'error');
        btn.innerText = "Log In";
        btn.disabled = false;
      });
  });
  
  // Register Logic (With Unique Username Check) - FIXED
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim().toLowerCase();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const btn = registerForm.querySelector('button');
    
    // Validation
    if (!isValidUsername(username)) {
      showToast("Username must be 3-20 characters (lowercase letters, numbers, underscores only)", "error");
      return;
    }
    
    if (RESERVED_USERNAMES.includes(username)) {
      showToast("This username is reserved. Please choose another.", "error");
      return;
    }
    
    if (password.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    
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
      
      // 3. Save User Data to Firestore - WAIT FOR IT TO COMPLETE
      await setDoc(doc(db, "users", user.uid), {
        username: username,
        email: email,
        createdAt: serverTimestamp()
      });
      
      showToast("Account created successfully!", "success");
      
      window.location.href = 'dashboard.html';
      
    } catch (err) {
      let errorMessage = err.message;
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address.";
      } else if (err.code === 'auth/weak-password') {
        errorMessage = "Password is too weak.";
      }
      showToast(errorMessage, 'error');
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
      try {
        // Always call setupDashboard, even without username yet
        setupDashboard(user); // no need to wait for doc
        
        // Messages will still load correctly because they use UID
        const q = query(
          collection(db, "messages"),
          where("receiverId", "==", user.uid),
          orderBy("timestamp", "desc")
        );
      } catch (error) {
        console.error("Error loading user data:", error);
        showToast("Error loading profile. Please refresh.", "error");
        setupDashboard(user, "error_loading");
      }
    }
  });
  
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = 'index.html')
      .catch(err => {
        console.error("Logout error:", err);
        showToast("Error logging out", "error");
      });
  });
}

function setupDashboard(user, usernameFallback = null) {
  // Always set UI with fallback first
  const avatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(user.uid)}`;
  document.getElementById('user-avatar')?.setAttribute('src', avatarUrl);
  document.getElementById('display-username')?.setAttribute('textContent', usernameFallback ? "@" + usernameFallback : "@loading...");
  document.getElementById('user-email')?.setAttribute('textContent', user.email);
  
  // Now try to load real username with strong retry
  const loadUserData = async () => {
    for (let i = 0; i < 15; i++) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const username = data.username;
          
          // Update UI with real username
          const usernameEl = document.getElementById('display-username');
          if (usernameEl) usernameEl.textContent = "@" + username;
          
          const avatarEl = document.getElementById('user-avatar');
          if (avatarEl) {
            avatarEl.src = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(username)}`;
          }
          
          // Update share link
          const shareUrl = `${window.location.origin}/send.html?u=${encodeURIComponent(username)}`;
          const linkInput = document.getElementById('share-link');
          if (linkInput) linkInput.value = shareUrl;
          
          return; // Success → exit
        }
      } catch (err) {
        console.error("Retry failed:", err);
      }
      await new Promise(r => setTimeout(r, 800));
    }
    
    // Final fallback after 15 retries (~12 seconds)
    showToast("Having trouble loading your username. Using temporary ID.", "error");
    const tempUsername = "user_" + user.uid.slice(-6);
    document.getElementById('display-username').textContent = "@" + tempUsername;
    const shareUrl = `${window.location.origin}/send.html?u=${tempUsername}`;
    document.getElementById('share-link').value = shareUrl;
  };
  
  loadUserData();
}

// --- 3. SEND PAGE ---
if (pageId === 'page-send') {
  const params = new URLSearchParams(window.location.search);
  const targetUsername = params.get('u')?.toLowerCase().trim();
  let targetUid = null;
  let isInitialized = false;
  
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
        const container = document.querySelector('.container');
        if (container) {
          container.innerHTML = "<h2>User not found 😕</h2><p><a href='index.html' style='color: var(--accent);'>Go Home</a></p>";
        }
        return;
      }
      
      // Get the first matching doc (should be unique)
      const userDoc = querySnapshot.docs[0];
      targetUid = userDoc.id;
      isInitialized = true;
      
      // Update UI
      const usernameEl = document.getElementById('target-username');
      if (usernameEl) usernameEl.textContent = "@" + targetUsername;
      
      const avatarEl = document.getElementById('target-avatar');
      if (avatarEl) {
        avatarEl.src = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(targetUsername)}`;
      }
      
    } catch (error) {
      console.error("Error fetching user:", error);
      showToast("Error loading user profile", "error");
    }
  })();
  
  // Character Count
  const textarea = document.getElementById('msg-text');
  textarea?.addEventListener('input', () => {
    const charsEl = document.getElementById('chars');
    if (charsEl && textarea) {
      charsEl.innerText = textarea.value.length;
    }
  });
  
  // Send Logic
  const msgForm = document.getElementById('msg-form');
  msgForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!isInitialized || !targetUid) {
      showToast("Still loading user profile. Please wait...", "error");
      return;
    }
    
    const text = textarea?.value.trim();
    const btn = e.target.querySelector('button');
    
    if (!text) {
      showToast("Please enter a message", "error");
      return;
    }
    
    if (text.length > 500) {
      showToast("Message too long (max 500 characters)", "error");
      return;
    }
    
    if (btn) {
      btn.disabled = true;
      btn.innerText = "Sending...";
    }
    
    try {
      await addDoc(collection(db, "messages"), {
        text: text,
        receiverId: targetUid,
        timestamp: serverTimestamp()
      });
      
      document.getElementById('msg-form')?.classList.add('hidden');
      document.getElementById('success-message')?.classList.remove('hidden');
      showToast("Message sent anonymously!", "success");
    } catch (error) {
      console.error("Send error:", error);
      showToast("Failed to send message. Please try again.", "error");
      if (btn) {
        btn.disabled = false;
        btn.innerText = "Send Anonymously 🚀";
      }
    }
  });
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}