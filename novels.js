// DEBOUNCE UTILITY (Crucial for scroll performance)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const html = document.documentElement;
const progressBar = document.getElementById('progressBar');
const toast = document.getElementById('toast');
const bookId = 'wilde_earnest_v1';

// --- THEME MANAGEMENT (Light -> Sepia -> Dark) ---
const themes = ['light', 'sepia', 'dark'];
const icons = { 'light': '☀️', 'sepia': '☕', 'dark': '🌙' };
let currentThemeIndex = themes.indexOf(localStorage.getItem('theme') || 'light');

function applyTheme(index) {
  const theme = themes[index];
  html.setAttribute('data-theme', theme);
  document.getElementById('themeIcon').textContent = icons[theme];
  document.querySelector('meta[name="theme-color"]').setAttribute('content',
    theme === 'dark' ? '#111111' : (theme === 'sepia' ? '#f4ecd8' : '#fafafa')
  );
  localStorage.setItem('theme', theme);
}

document.getElementById('themeToggle').addEventListener('click', () => {
  currentThemeIndex = (currentThemeIndex + 1) % themes.length;
  applyTheme(currentThemeIndex);
});

// Apply immediately
applyTheme(currentThemeIndex);

// --- FONT SIZE MANAGEMENT ---
let currentFontSize = parseInt(localStorage.getItem('fontSize')) || 18;
document.getElementById('fontToggle').addEventListener('click', () => {
  currentFontSize = currentFontSize >= 22 ? 16 : currentFontSize + 2;
  html.style.setProperty('--fs-base', `${currentFontSize}px`);
  localStorage.setItem('fontSize', currentFontSize);
});
html.style.setProperty('--fs-base', `${currentFontSize}px`);

// --- PROGRESS TRACKING ---
const updateProgress = debounce(() => {
  const winScroll = window.scrollY;
  const height = document.documentElement.scrollHeight - window.innerHeight;
  const scrolled = (winScroll / height) * 100;
  
  requestAnimationFrame(() => {
    progressBar.style.width = scrolled + '%';
  });
  
  localStorage.setItem(`${bookId}_progress`, winScroll);
}, 100); // 100ms delay prevents firing too often

window.addEventListener('scroll', updateProgress, { passive: true });

// --- RESTORE PROGRESS ---
const savedProgress = parseFloat(localStorage.getItem(`${bookId}_progress`));
if (savedProgress && savedProgress > 500) {
  showToast('Continue where you left off?', true, () => {
    window.scrollTo({ top: savedProgress, behavior: 'smooth' });
  });
}

// --- SHARE & RESET ---
document.getElementById('resetProgress').addEventListener('click', () => {
  localStorage.removeItem(`${bookId}_progress`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('Progress Reset!');
});

document.getElementById('shareBtn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.href.split('#')[0]);
    showToast('Link Copied!');
  } catch (err) {
    showToast('Error Link!');
  }
});

// --- RETURN HOME --- //
document.getElementById('homeBtn').addEventListener('click', async () => {
  window.location.href = "../index.html";
});

// --- TOAST SYSTEM ---
function showToast(msg, hasActions = false, onYes = null) {
  const msgEl = document.getElementById('toastMessage');
  const actionEl = document.getElementById('toastActions');
  const yesBtn = document.getElementById('toastYes');
  const noBtn = document.getElementById('toastNo');
  
  msgEl.textContent = msg;
  msgEl.style.width = "100%"
  actionEl.style.display = hasActions ? 'flex' : 'none';
  toast.classList.add('show');
  
  if (hasActions) {
    // Clean up old listeners
    const newYes = yesBtn.cloneNode(true);
    const newNo = noBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYes, yesBtn);
    noBtn.parentNode.replaceChild(newNo, noBtn);
    
    newYes.addEventListener('click', () => {
      if (onYes) onYes();
      toast.classList.remove('show');
    });
    newNo.addEventListener('click', () => toast.classList.remove('show'));
  } else {
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}