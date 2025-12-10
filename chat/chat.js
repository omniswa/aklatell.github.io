import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, getDocs, setDoc, doc, updateDoc, increment, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration - REPLACE WITH YOUR CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCX2rt16v6nM6zeJkAZTkeiJmMzrEfHrBY",
  authDomain: "aklatell-chat.firebaseapp.com",
  databaseURL: "https://aklatell-chat-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aklatell-chat",
  storageBucket: "aklatell-chat.firebasestorage.app",
  messagingSenderId: "717231832884",
  appId: "1:717231832884:web:4df4a1e0fdd3fa20f7ef61",
  measurementId: "G-27JG5D6J46"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// State
let currentUser = null;
let currentRoom = null;
let isSignUp = false;
let unsubscribeMessages = null;
let unsubscribeRooms = null;
let isAdmin = false;

// DOM Elements
const authScreen = document.getElementById('authScreen');
const chatContainer = document.getElementById('chatContainer');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authToggleBtn = document.getElementById('authToggleBtn');
const authError = document.getElementById('authError');
const displayNameGroup = document.getElementById('displayNameGroup');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const displayNameInput = document.getElementById('displayName');
const userInfo = document.getElementById('userInfo');
const logoutBtn = document.getElementById('logoutBtn');
const roomsList = document.getElementById('roomsList');
const newRoomInput = document.getElementById('newRoomInput');
const currentRoomName = document.getElementById('currentRoomName');
const messagesContainer = document.getElementById('messagesContainer');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const addRoomSection = document.getElementById('addRoomSection');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');

// Auth State Observer
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await checkUserRole(user.uid);
    showChat();
    loadRooms();
  } else {
    currentUser = null;
    isAdmin = false;
    showAuth();
  }
});

// Check User Role
async function checkUserRole(uid) {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    isAdmin = userDoc.data().role === 'admin';
  } else {
    // Create user profile if not exists
    await setDoc(doc(db, 'users', uid), {
      role: 'user',
      email: currentUser.email,
      displayName: currentUser.displayName
    });
    isAdmin = false;
  }
  addRoomSection.style.display = isAdmin ? 'block' : 'none';
}

// Toggle between Sign In and Sign Up
authToggleBtn.addEventListener('click', () => {
  isSignUp = !isSignUp;
  if (isSignUp) {
    authTitle.textContent = 'Create Account';
    authSubmitBtn.textContent = 'Sign Up';
    authToggleBtn.textContent = 'Already have an account?';
    displayNameGroup.style.display = 'block';
    displayNameInput.required = true;
  } else {
    authTitle.textContent = 'Sign In';
    authSubmitBtn.textContent = 'Sign In';
    authToggleBtn.textContent = 'Create Account';
    displayNameGroup.style.display = 'none';
    displayNameInput.required = false;
  }
  authError.textContent = '';
});

// Auth Form Submit
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const displayName = displayNameInput.value.trim();
  
  try {
    let userCredential;
    if (isSignUp) {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: displayName || email.split('@')[0] });
      // Create user profile
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        role: 'user',  // New users are not admins by default
        email: email,
        displayName: displayName || email.split('@')[0]
      });
    } else {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (error) {
    authError.textContent = error.message;
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
  }
});

// Create Room (Admin Only)
newRoomInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter' && newRoomInput.value.trim() && isAdmin) {
    const roomName = newRoomInput.value.trim();
    try {
      const roomRef = doc(db, 'rooms', roomName.toLowerCase().replace(/\s+/g, '-'));
      await setDoc(roomRef, {
        name: roomName,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        messageCount: 0
      });
      newRoomInput.value = '';
    } catch (error) {
      console.error('Error creating room:', error);
    }
  }
});

// Load Rooms
function loadRooms() {
  if (unsubscribeRooms) unsubscribeRooms();
  
  const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'), limit(50));  // Limit to 50 rooms for performance
  unsubscribeRooms = onSnapshot(q, (snapshot) => {
    roomsList.innerHTML = '';
    snapshot.forEach((doc) => {
      const room = doc.data();
      const roomEl = document.createElement('div');
      roomEl.className = 'room-item';
      if (currentRoom && currentRoom.id === doc.id) {
        roomEl.classList.add('active');
      }
      roomEl.innerHTML = `
        <div class="room-name">${room.name}</div>
        <div class="room-users">${room.messageCount || 0} messages</div>
      `;
      roomEl.addEventListener('click', () => selectRoom(doc.id, room.name));
      roomsList.appendChild(roomEl);
    });
  });
}

// Select Room
function selectRoom(roomId, roomName) {
  currentRoom = { id: roomId, name: roomName };
  currentRoomName.textContent = roomName;
  messageInput.disabled = false;
  sendBtn.disabled = false;
  
  document.querySelectorAll('.room-item').forEach(el => el.classList.remove('active'));
  event.target.closest('.room-item').classList.add('active');
  
  loadMessages(roomId);
  if (window.innerWidth <= 768) {
    sidebar.classList.add('hidden');
  }
}

// Load Messages
function loadMessages(roomId) {
  if (unsubscribeMessages) unsubscribeMessages();
  
  messagesContainer.innerHTML = '';
  
  const q = query(
    collection(db, 'rooms', roomId, 'messages'),
    orderBy('timestamp', 'asc'),
    limit(50)  // Limit messages loaded for performance
  );
  
  unsubscribeMessages = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const msg = change.doc.data();
        displayMessage(msg);
      }
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

// Display Message
function displayMessage(msg) {
  const isOwn = msg.userId === currentUser.uid;
  const messageEl = document.createElement('div');
  messageEl.className = `message ${isOwn ? 'own' : ''}`;
  
  const avatar = (msg.displayName || msg.email || 'U')[0].toUpperCase();
  const time = msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now';
  
  messageEl.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">
      <div class="message-header">
        <span class="message-author">${msg.displayName || msg.email}</span>
        <span class="message-time">${time}</span>
      </div>
      <div class="message-text">${escapeHtml(msg.text)}</div>
    </div>
  `;
  
  messagesContainer.appendChild(messageEl);
}

// Send Message
messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const text = messageInput.value.trim();
  if (!text || !currentRoom) return;
  
  try {
    await addDoc(collection(db, 'rooms', currentRoom.id, 'messages'), {
      text: text,
      userId: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName || currentUser.email.split('@')[0],
      timestamp: serverTimestamp()
    });
    
    await updateDoc(doc(db, 'rooms', currentRoom.id), {
      messageCount: increment(1)
    });
    
    messageInput.value = '';
  } catch (error) {
    console.error('Error sending message:', error);
  }
});

// Mobile Menu Toggle
menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('hidden');
});

// Helper Functions
function showAuth() {
  authScreen.classList.remove('hidden');
  chatContainer.classList.add('hidden');
  if (unsubscribeMessages) unsubscribeMessages();
  if (unsubscribeRooms) unsubscribeRooms();
}

function showChat() {
  authScreen.classList.add('hidden');
  chatContainer.style.display = 'flex';
  userInfo.textContent = currentUser.displayName || currentUser.email;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Debounce function for performance (e.g., for future search if added)
function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}