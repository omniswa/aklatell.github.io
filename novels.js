const elements = {
  mainControlBtn: null,
  controlMenu: null,
  themeBtn: null,
  homeBtn: null,
  progressBar: null,
  backToTop: null,
  html: document.documentElement
};

// State
const state = {
  theme: "light",
  menuOpen: false,
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
  elements.mainControlBtn = document.getElementById("mainControlBtn");
  elements.controlMenu = document.getElementById("controlMenu");
  elements.themeBtn = document.getElementById("themeBtn");
  elements.homeBtn = document.getElementById("homeBtn");
  elements.progressBar = document.getElementById("progressBar");
  elements.backToTop = document.getElementById("backToTop");
  
  initTheme();
  
  // Event Listeners
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
  
  window.addEventListener("scroll", () => {
    requestAnimationFrame(handleProgressBar);
  }, { passive: true });
  
  // Initialize tracker
  handleProgressBar();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}