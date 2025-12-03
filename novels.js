const elements = {
  mainControlBtn: null,
  controlMenu: null,
  themeBtn: null,
  homeBtn: null,
  resetBtn: null,
  progressBar: null,
  backToTop: null,
  toast: null,
  restoreBtn: null,
  closeToastBtn: null,
  html: document.documentElement
};

// State
const state = {
  theme: "light",
  menuOpen: false,
  currentParagraphIndex: 0,
  bookKey: "book-default"
};

function initTheme() {
  state.theme = elements.html.getAttribute("data-theme") || "light";
  if (elements.themeBtn) {
    elements.themeBtn.textContent = state.theme === "dark" ? "☀️" : "🌙";
  }
}

function setTheme(theme) {
  state.theme = theme;
  elements.html.setAttribute("data-theme", theme);
  try { localStorage.setItem("user-theme", theme); } catch (e) {}
  if (elements.themeBtn) elements.themeBtn.textContent = theme === "dark" ? "☀️" : "🌙";
}

// --- NEW: Generate Unique Key per Book ---
function generateBookKey() {
  const path = window.location.pathname;
  // Fallback to 'index' if filename is empty
  const filename = path.substring(path.lastIndexOf('/') + 1) || 'index';
  state.bookKey = `read-progress-${filename}`;
}

// --- NEW: Progress Tracker with Toast ---
function initProgressTracker() {
  generateBookKey();
  
  const readableElements = document.querySelectorAll('.chapter p, .chapter h2, .chapter h3');
  const savedIndex = localStorage.getItem(state.bookKey);
  
  // 1. If we have a saved spot (and it's not the very top), show the toast
  if (savedIndex && parseInt(savedIndex) > 2) {
    const targetIndex = parseInt(savedIndex);
    
    // Show Toast logic
    if (elements.toast) {
      setTimeout(() => elements.toast.classList.add('visible'), 500);
      
      // Handle "Jump to location" click
      elements.restoreBtn.onclick = () => {
        if (readableElements[targetIndex]) {
          readableElements[targetIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
          elements.toast.classList.remove('visible');
        }
      };
      
      // Handle "Close" click
      elements.closeToastBtn.onclick = () => {
        elements.toast.classList.remove('visible');
      };
    }
  }
  
  // 2. Start observing user's position
  const observer = new IntersectionObserver((entries) => {
    const visibleEntry = entries.find(entry => entry.isIntersecting);
    
    if (visibleEntry) {
      const index = Array.from(readableElements).indexOf(visibleEntry.target);
      
      if (index > -1) {
        state.currentParagraphIndex = index;
        
        // Safety: Only save to local storage if the user has actually scrolled 
        // This prevents overwriting a deep save (e.g. paragraph 500) with "0" 
        // just because the user opened the page and is staring at the Toast.
        if (window.scrollY > 100 || index > 2) {
          localStorage.setItem(state.bookKey, index);
        }
      }
    }
  }, {
    rootMargin: '-40% 0px -40% 0px',
    threshold: 0
  });
  
  readableElements.forEach(el => observer.observe(el));
}

// --- NEW: Reset Progress Function ---
function resetProgress() {
  // Confirm before deleting
  if (confirm("Reset your reading progress for this book?")) {
    // 1. Clear storage
    localStorage.removeItem(state.bookKey);
    // 2. Reset state
    state.currentParagraphIndex = 0;
    // 3. Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // 4. Hide toast if it's open
    if (elements.toast) elements.toast.classList.remove('visible');
    // 5. Close menu
    state.menuOpen = false;
    if (elements.controlMenu) elements.controlMenu.classList.remove("open");
  }
}

function handleProgressBar() {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollTop = window.scrollY;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  
  if (elements.progressBar) {
    elements.progressBar.style.width = Math.min(100, Math.max(0, pct)) + "%";
  }
  if (elements.backToTop) {
    elements.backToTop.classList.toggle("show", scrollTop > 800);
  }
}

function init() {
  // Select DOM Elements
  elements.mainControlBtn = document.getElementById("mainControlBtn");
  elements.controlMenu = document.getElementById("controlMenu");
  elements.themeBtn = document.getElementById("themeBtn");
  elements.homeBtn = document.getElementById("homeBtn");
  elements.resetBtn = document.getElementById("resetBtn");
  elements.progressBar = document.getElementById("progressBar");
  elements.backToTop = document.getElementById("backToTop");
  
  // Toast Elements
  elements.toast = document.getElementById("restore-toast");
  elements.restoreBtn = document.getElementById("restore-btn");
  elements.closeToastBtn = document.getElementById("close-toast");
  
  initTheme();
  initProgressTracker(); // Start tracking
  
  // Event Listeners
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    
    // Close menu if clicking outside
    if (!e.target.closest(".floating-controls") && state.menuOpen) {
      state.menuOpen = false;
      if (elements.controlMenu) elements.controlMenu.classList.remove("open");
    }
    
    if (!btn) return;
    
    switch (btn.id) {
      case "mainControlBtn":
        state.menuOpen = !state.menuOpen;
        if (elements.controlMenu) elements.controlMenu.classList.toggle("open", state.menuOpen);
        break;
      case "themeBtn":
        setTheme(state.theme === "dark" ? "light" : "dark");
        break;
      case "homeBtn":
        window.location.href = "../index.html";
        break;
      case "resetBtn":
        resetProgress();
        break;
      case "backToTop":
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
    }
  });
  
  window.addEventListener("scroll", () => {
    requestAnimationFrame(handleProgressBar);
  }, { passive: true });
  
  handleProgressBar();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}