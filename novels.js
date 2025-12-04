document.addEventListener('DOMContentLoaded', () => {
  // --- CONFIGURATION ---
  // Use pathname to generate a unique ID for this specific book file
  const BOOK_ID = 'book_prog_' + window.location.pathname.split('/').pop();
  const THEME_KEY = 'reader_theme';
  
  // --- DOM ELEMENTS ---
  const progressBar = document.getElementById('progress-bar');
  const settingsToggle = document.getElementById('settings-toggle');
  const settingsPanel = document.getElementById('settings-panel');
  const shareBtn = document.getElementById('share-btn');
  const resumeToast = document.getElementById('resume-toast');
  
  // --- THEME LOGIC ---
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    
    // Update active state in menu
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.setTheme === theme);
    });
  }
  
  // Initialize Theme
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(savedTheme);
  
  // Theme Buttons
  document.querySelectorAll('[data-set-theme]').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.setTheme));
  });
  
  // --- SCROLL PROGRESS LOGIC ---
  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    
    progressBar.style.width = scrollPercent + '%';
    
    // Save progress (throttled)
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(() => {
        localStorage.setItem(BOOK_ID, scrollPercent);
      });
    } else {
      localStorage.setItem(BOOK_ID, scrollPercent);
    }
  }
  
  window.addEventListener('scroll', updateProgress);
  
  // --- RESUME POSITION LOGIC ---
  const savedProgress = parseFloat(localStorage.getItem(BOOK_ID));
  
  // Only show toast if progress is > 1% and < 99% (so we don't annoy users at very start or end)
  if (savedProgress && savedProgress > 1 && savedProgress < 99) {
    resumeToast.classList.add('visible');
    
    document.getElementById('toast-yes').addEventListener('click', () => {
      const docHeight = document.body.scrollHeight - window.innerHeight;
      const targetScroll = (savedProgress / 100) * docHeight;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      resumeToast.classList.remove('visible');
    });
    
    document.getElementById('toast-no').addEventListener('click', () => {
      resumeToast.classList.remove('visible');
      // Optional: Reset progress if they dismiss? No, just let them read from top.
    });
  }
  
  // Reset Progress Button
  document.getElementById('reset-progress').addEventListener('click', () => {
    localStorage.removeItem(BOOK_ID);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    settingsPanel.classList.remove('active');
  });
  
  // --- UI INTERACTIONS ---
  
  // Toggle Settings
  settingsToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsPanel.classList.toggle('active');
  });
  
  // Close settings when clicking outside
  document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && e.target !== settingsToggle) {
      settingsPanel.classList.remove('active');
    }
  });
  
  // Share/Copy Link Logic
  shareBtn.addEventListener('click', () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  });
});