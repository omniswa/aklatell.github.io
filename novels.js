const elements = { mainControlBtn: null, controlMenu: null, themeBtn: null, homeBtn: null, progressBar: null, backToTop: null, html: document.documentElement };
const state = { theme: "light", scrollPosition: 0, menuOpen: false, isRestoring: false, hasRestoredScroll: false };

function initTheme() {
  const savedTheme = localStorage.getItem("user-theme");
  if (savedTheme) {
    state.theme = savedTheme;
  } else {
    state.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  setTheme(state.theme);
}

function setTheme(theme) {
  state.theme = theme;
  elements.html.setAttribute("data-theme", theme);
  try { localStorage.setItem("user-theme", theme); } catch (e) {}
  if (elements.themeBtn) elements.themeBtn.textContent = theme === "dark" ? "☀️" : "🌙";
}

function getScrollEl() {
  return document.scrollingElement || document.documentElement || document.body;
}

function computeMaxScroll() {
  const scrollEl = getScrollEl();
  const doc = document.documentElement;
  const body = document.body;
  const scrollHeight = Math.max(doc.scrollHeight || 0, body.scrollHeight || 0, scrollEl.scrollHeight || 0);
  const max = Math.max(0, scrollHeight - window.innerHeight);
  return max;
}

let scrollTicking = false;

function handleScroll() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    const scrollEl = getScrollEl();
    const scrollY = Math.max(0, Math.floor(scrollEl.scrollTop || window.scrollY || 0));
    state.scrollPosition = scrollY;
    const maxHeight = computeMaxScroll();
    if (maxHeight > 0 && elements.progressBar) {
      let pct = (scrollY / maxHeight) * 100;
      pct = Math.max(0, Math.min(100, pct));
      elements.progressBar.style.width = pct + "%";
    } else if (elements.progressBar) {
      elements.progressBar.style.width = "0%";
    }
    if (elements.backToTop) {
      elements.backToTop.classList.toggle("show", scrollY > 500);
    }
    scrollTicking = false;
  });
}

const bookKey = "progress_" + (location.pathname.split("/").pop() || "default");
let scrollSaveTimer;

function saveScrollPosition() {
  if (state.isRestoring || !state.hasRestoredScroll) return;
  
  clearTimeout(scrollSaveTimer);
  scrollSaveTimer = setTimeout(() => {
    try {
      const scrollEl = getScrollEl();
      const scrollY = Math.floor(scrollEl.scrollTop || window.scrollY || 0);
      const maxScroll = computeMaxScroll();
      const percentage = maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0;
      
      // Only save if there's meaningful scroll
      if (scrollY > 50) {
        const data = {
          position: scrollY,
          percentage: percentage,
          maxScroll: maxScroll,
          timestamp: Date.now(),
          viewportHeight: window.innerHeight,
          documentHeight: document.documentElement.scrollHeight
        };
        localStorage.setItem(bookKey, JSON.stringify(data));
      }
    } catch (e) {
      console.error('Error saving scroll:', e);
    }
  }, 500);
}

function restoreScrollPosition() {
  try {
    const savedData = localStorage.getItem(bookKey);
    if (!savedData) {
      state.hasRestoredScroll = true;
      return;
    }
    
    const data = JSON.parse(savedData);
    if (!data || typeof data.position !== 'number') {
      state.hasRestoredScroll = true;
      return;
    }
    
    // Check if data is recent (within 7 days)
    const daysSinceLastVisit = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
    if (daysSinceLastVisit > 7) {
      localStorage.removeItem(bookKey);
      state.hasRestoredScroll = true;
      return;
    }
    
    state.isRestoring = true;
    
    // Use percentage-based restoration for better accuracy
    const currentMaxScroll = computeMaxScroll();
    let targetPosition;
    
    if (currentMaxScroll > 0 && data.percentage) {
      targetPosition = Math.floor((data.percentage / 100) * currentMaxScroll);
    } else {
      targetPosition = data.position;
    }
    
    // Ensure position is valid
    targetPosition = Math.max(0, Math.min(targetPosition, currentMaxScroll));
    
    // Only restore if position is meaningful (not at the top)
    if (targetPosition > 50) {
      window.scrollTo({ top: targetPosition, behavior: 'instant' });
    }
    
    setTimeout(() => {
      state.isRestoring = false;
      state.hasRestoredScroll = true;
      handleScroll();
    }, 100);
  } catch (e) {
    console.error('Error restoring scroll:', e);
    state.isRestoring = false;
    state.hasRestoredScroll = true;
  }
}

function createUIElements() {
  if (document.getElementById('progressBarContainer')) return;
  
  const fragment = document.createDocumentFragment();
  
  const progressBarContainer = document.createElement('div');
  progressBarContainer.id = 'progressBarContainer';
  progressBarContainer.innerHTML = '<div id="progressBar" aria-hidden="true"></div>';
  fragment.appendChild(progressBarContainer);
  
  const floatingControls = document.createElement('div');
  floatingControls.className = 'floating-controls';
  floatingControls.innerHTML = `
    <button class="control-btn" id="mainControlBtn" aria-label="Menu">☰</button>
    <div class="control-menu" id="controlMenu" aria-hidden="true">
      <button class="control-item" id="homeBtn" aria-label="Home">🏠</button>
      <button class="control-item" id="themeBtn" aria-label="Toggle Theme">🌙</button>
    </div>
  `;
  fragment.appendChild(floatingControls);
  
  const backToTop = document.createElement('button');
  backToTop.id = 'backToTop';
  backToTop.setAttribute('aria-label', 'Back to Top');
  backToTop.textContent = '↑';
  fragment.appendChild(backToTop);
  
  document.body.insertBefore(fragment, document.body.firstChild);
}

function setupEventDelegation() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
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
      case "backToTop":
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
    }
  });
  
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href^='#']");
    if (!link) return;
    e.preventDefault();
    const target = document.querySelector(link.getAttribute("href"));
    if (target) { target.scrollIntoView({ behavior: "smooth" }); }
  });
}

function setupScrollSaving() {
  let lastScroll = 0;
  
  window.addEventListener("scroll", () => {
    handleScroll();
    const currentScroll = window.scrollY || document.documentElement.scrollTop || 0;
    if (Math.abs(currentScroll - lastScroll) > 20) {
      lastScroll = currentScroll;
      saveScrollPosition();
    }
  }, { passive: true });
  
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      saveScrollPosition();
    }
  });
  
  window.addEventListener("beforeunload", () => {
    saveScrollPosition();
  });
}

function init() {
  createUIElements();
  
  elements.mainControlBtn = document.getElementById("mainControlBtn");
  elements.controlMenu = document.getElementById("controlMenu");
  elements.themeBtn = document.getElementById("themeBtn");
  elements.homeBtn = document.getElementById("homeBtn");
  elements.progressBar = document.getElementById("progressBar");
  elements.backToTop = document.getElementById("backToTop");
  
  initTheme();
  
  setupEventDelegation();
  setupScrollSaving();
  
  // Restore scroll after a short delay to ensure layout is complete
  requestAnimationFrame(() => {
    setTimeout(() => {
      restoreScrollPosition();
    }, 50);
  });
  
  handleScroll();
  
  // Set up ResizeObserver for dynamic content
  let ro;
  try {
    ro = new ResizeObserver(() => {
      if (!state.isRestoring) {
        handleScroll();
      }
    });
    ro.observe(document.body);
  } catch (e) {
    window.addEventListener('resize', () => {
      if (!state.isRestoring) {
        handleScroll();
      }
    }, { passive: true });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}