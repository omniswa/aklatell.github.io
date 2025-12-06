(function() {
  'use strict';
  const THEME_KEY = 'reader_theme';
  const FONT_KEY = 'reader_font';
  const SIZE_KEY = 'reader_size';
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  const savedFont = localStorage.getItem(FONT_KEY) || 'Newsreader';
  const savedSize = localStorage.getItem(SIZE_KEY) || 'medium';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.documentElement.setAttribute('data-font', savedFont.toLowerCase());
  const sizeMap = { small: '1rem', medium: '1.125rem', large: '1.25rem' };
  document.documentElement.style.setProperty('--font-size-base', sizeMap[savedSize])
})();

document.addEventListener('DOMContentLoaded', () => {
  const BOOK_ID = 'book_prog_' + window.location.pathname.split('/').pop();
  const THEME_KEY = 'reader_theme';
  const FONT_KEY = 'reader_font';
  const SIZE_KEY = 'reader_size';
  const fragment = document.createDocumentFragment();
  
  // Progress Elements
  const progressContainer = document.createElement('div');
  progressContainer.id = 'progress-container';
  const progressBar = document.createElement('div');
  progressBar.id = 'progress-bar';
  progressContainer.appendChild(progressBar);
  fragment.appendChild(progressContainer);
  
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
  homeBtn.addEventListener('click', () => { window.location.href = '../index.html' }, { passive: !0 });
  uiControls.appendChild(homeBtn);
  
  // Share Button
  const shareBtn = document.createElement('button');
  shareBtn.className = 'btn-fab';
  shareBtn.id = 'share-btn';
  shareBtn.title = 'Copy Link';
  shareBtn.setAttribute('aria-label', 'Share Link');
  shareBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;
  uiControls.appendChild(shareBtn);
  
  // Settings Button
  const settingsToggle = document.createElement('button');
  settingsToggle.className = 'btn-fab';
  settingsToggle.id = 'settings-toggle';
  settingsToggle.title = 'Settings';
  settingsToggle.setAttribute('aria-label', 'Reading Settings');
  settingsToggle.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
  uiControls.appendChild(settingsToggle);
  fragment.appendChild(uiControls);
  
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
      <span class="setting-label">FONT</span>
      <div class="font-toggles">
        <div class="font-btn" data-set-font="Arial">Arial</div>
        <div class="font-btn" data-set-font="Spectral">Spectral</div>
        <div class="font-btn" data-set-font="Domine">Domine</div>
      </div>
    </div>
    <div class="setting-group">
      <span class="setting-label">FONT SIZE</span>
      <div class="size-toggles">
        <div class="size-btn" data-set-size="small">Small</div>
        <div class="size-btn" data-set-size="medium">Medium</div>
        <div class="size-btn" data-set-size="large">Large</div>
      </div>
    </div>
    <div class="setting-group">
      <span class="setting-label">PROGRESS</span>
      <button class="btn-ghost" id="reset-progress" style="width: 100%;">Reset Position</button>
    </div>
  `;
  fragment.appendChild(settingsPanel);
  
  // Resume Toast
  const resumeToast = document.createElement('div');
  resumeToast.className = 'toast';
  resumeToast.id = 'resume-toast';
  resumeToast.innerHTML = `
    <span>Resume reading?</span>
    <div class="toast-actions">
      <button class="btn-ghost" id="toast-no">Dismiss</button>
      <button class="btn-primary" id="toast-yes">Jump</button>
    </div>
  `;
  fragment.appendChild(resumeToast);
  document.body.appendChild(fragment);
  
  // Logic Functions
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    document.querySelectorAll('.theme-btn').forEach(btn => { btn.classList.toggle('active', btn.dataset.setTheme === theme) })
  }
  
  function applyFont(font) {
    document.documentElement.setAttribute('data-font', font.toLowerCase());
    localStorage.setItem(FONT_KEY, font);
    document.querySelectorAll('.font-btn').forEach(btn => { btn.classList.toggle('active', btn.dataset.setFont === font) })
  }
  
  const sizeMap = { small: '1rem', medium: '1.125rem', large: '1.25rem' };
  
  function applySize(size) {
    document.documentElement.style.setProperty('--font-size-base', sizeMap[size]);
    localStorage.setItem(SIZE_KEY, size);
    document.querySelectorAll('.size-btn').forEach(btn => { btn.classList.toggle('active', btn.dataset.setSize === size) });
    // Recalculate document height when font size changes
    calculateDocHeight();
  }
  
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  const savedFont = localStorage.getItem(FONT_KEY) || 'Arial';
  const savedSize = localStorage.getItem(SIZE_KEY) || 'medium';
  
  document.querySelectorAll('.theme-btn').forEach(btn => { btn.classList.toggle('active', btn.dataset.setTheme === savedTheme) });
  document.querySelectorAll('.font-btn').forEach(btn => { btn.classList.toggle('active', btn.dataset.setFont === savedFont) });
  document.querySelectorAll('.size-btn').forEach(btn => { btn.classList.toggle('active', btn.dataset.setSize === savedSize) });
  
  document.querySelectorAll('[data-set-theme]').forEach(btn => { btn.addEventListener('click', () => applyTheme(btn.dataset.setTheme), { passive: !0 }) });
  document.querySelectorAll('[data-set-font]').forEach(btn => { btn.addEventListener('click', () => applyFont(btn.dataset.setFont), { passive: !0 }) });
  document.querySelectorAll('[data-set-size]').forEach(btn => { btn.addEventListener('click', () => applySize(btn.dataset.setSize), { passive: !0 }) });
  
  // --- OPTIMIZED SCROLL LOGIC ---
  let scrollTimeout;
  let ticking = !1;
  let cachedDocHeight = 0;
  
  // Calculate height once, or on resize, to avoid layout thrashing during scroll
  function calculateDocHeight() {
    cachedDocHeight = document.body.scrollHeight - window.innerHeight;
  }
  
  // Initial calculation
  calculateDocHeight();
  
  // Re-calculate on resize
  window.addEventListener('resize', calculateDocHeight, { passive: true });
  
  function updateProgress() {
    const scrollTop = window.scrollY;
    // Use cached height for better performance (High Frequency)
    const scrollPercent = cachedDocHeight > 0 ? Math.min((scrollTop / cachedDocHeight) * 100, 100) : 0;
    
    progressBar.style.width = scrollPercent + '%';
    
    if (scrollTimeout) { clearTimeout(scrollTimeout) }
    scrollTimeout = setTimeout(() => { try { localStorage.setItem(BOOK_ID, scrollPercent) } catch (e) { console.warn('Failed to save progress:', e) } }, 500)
  }
  
  function requestProgressUpdate() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateProgress();
        ticking = !1
      });
      ticking = !0
    }
  }
  
  window.addEventListener('scroll', requestProgressUpdate, { passive: !0 });
  
  // --- RESUME LOGIC ---
  const savedProgress = parseFloat(localStorage.getItem(BOOK_ID));
  if (savedProgress && savedProgress > 0.10 && savedProgress < 99) {
    setTimeout(() => { resumeToast.classList.add('visible') }, 100);
    
    document.getElementById('toast-yes').addEventListener('click', () => {
      // Ensure height is accurate before jumping
      calculateDocHeight();
      const targetScroll = (savedProgress / 100) * cachedDocHeight;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      resumeToast.classList.remove('visible')
    }, { passive: !0 });
    
    document.getElementById('toast-no').addEventListener('click', () => {
      resumeToast.classList.remove('visible');
      try { localStorage.removeItem(BOOK_ID) } catch (e) { console.warn('Failed to remove progress:', e) }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, { passive: !0 })
  }
  
  document.getElementById('reset-progress').addEventListener('click', () => {
    try { localStorage.removeItem(BOOK_ID) } catch (e) { console.warn('Failed to remove progress:', e) }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    settingsPanel.classList.remove('active')
  }, { passive: !0 });
  
  settingsToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsPanel.classList.toggle('active')
  });
  
  document.addEventListener('click', (e) => { if (!settingsPanel.contains(e.target) && e.target !== settingsToggle) { settingsPanel.classList.remove('active') } }, { passive: !0 });
  
  shareBtn.addEventListener('click', async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      const originalText = shareBtn.title;
      shareBtn.title = 'Copied!';
      setTimeout(() => { shareBtn.title = originalText }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Link copied to clipboard!')
    }
  }, { passive: !0 });
  
  requestProgressUpdate()
});