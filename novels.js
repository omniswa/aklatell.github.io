document.addEventListener('DOMContentLoaded', () => {
  // --- CONFIGURATION ---
  // Use pathname to generate a unique ID for this specific book file
  const BOOK_ID = 'book_prog_' + window.location.pathname.split('/').pop();
  const THEME_KEY = 'reader_theme';
  
  // --- CREATE DOM ELEMENTS DYNAMICALLY ---
  // Progress Container
  const progressContainer = document.createElement('div');
  progressContainer.id = 'progress-container';
  const progressBar = document.createElement('div');
  progressBar.id = 'progress-bar';
  progressContainer.appendChild(progressBar);
  document.body.appendChild(progressContainer);
  
  // UI Controls
  const uiControls = document.createElement('div');
  uiControls.className = 'ui-controls';
  
  // Home Button
  const homeBtn = document.createElement('button');
  homeBtn.className = 'btn-fab';
  homeBtn.id = 'home-btn';
  homeBtn.title = 'Home';
  homeBtn.setAttribute('aria-label', 'Home');
  homeBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  homeBtn.addEventListener('click', () => {
    window.location.href = '../index.html';
  });
  uiControls.appendChild(homeBtn);
  
  // Share Button
  const shareBtn = document.createElement('button');
  shareBtn.className = 'btn-fab';
  shareBtn.id = 'share-btn';
  shareBtn.title = 'Copy Link';
  shareBtn.setAttribute('aria-label', 'Share Link');
  shareBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;
  uiControls.appendChild(shareBtn);
  
  // Settings Toggle
  const settingsToggle = document.createElement('button');
  settingsToggle.className = 'btn-fab';
  settingsToggle.id = 'settings-toggle';
  settingsToggle.title = 'Settings';
  settingsToggle.setAttribute('aria-label', 'Reading Settings');
  settingsToggle.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
  uiControls.appendChild(settingsToggle);
  
  document.body.appendChild(uiControls);
  
  // Settings Panel
  const settingsPanel = document.createElement('div');
  settingsPanel.className = 'settings-panel';
  settingsPanel.id = 'settings-panel';
  settingsPanel.innerHTML = `
    <div class="setting-group">
      <span class="setting-label">THEME</span>
      <div class="theme-toggles">
        <div class="theme-btn" data-set-theme="light">Light</div>
        <div class="theme-btn" data-set-theme="sepia">Sepia</div>
        <div class="theme-btn" data-set-theme="dark">Dark</div>
      </div>
    </div>
    <div class="setting-group">
      <span class="setting-label">PROGRESS</span>
      <button class="btn-ghost" id="reset-progress" style="width: 100%;">Reset Position</button>
    </div>
  `;
  document.body.appendChild(settingsPanel);
  
  // Resume Toast
  const resumeToast = document.createElement('div');
  resumeToast.className = 'toast';
  resumeToast.id = 'resume-toast';
  resumeToast.innerHTML = `
    <span>Resume reading?</span>
    <div class="toast-actions">
      <button class="btn-ghost" id="toast-no">No</button>
      <button class="btn-primary" id="toast-yes">Jump</button>
    </div>
  `;
  document.body.appendChild(resumeToast);
  
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
      window.scrollTo({ top: targetScroll, behavior: 'auto' });
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
    window.scrollTo({ top: 0, behavior: 'auto' });
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