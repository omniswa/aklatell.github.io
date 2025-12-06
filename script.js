let allBooks = [];
let filteredBooks = [];
let favorites = [];
let renderedCount = 0;
const ITEMS_PER_PAGE = 12;
let currentFilter = 'all';

// Initialize app
const init = async () => {
  loadStorage();
  setupEventListeners();
  await fetchBooks();
};

const fetchBooks = async () => {
  const grid = document.getElementById('booksGrid');
  const skeletons = grid.querySelector('.loading-skeleton');
  const loadingText = grid.querySelector('.loading');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('books.json', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error('Failed to load books');
    
    allBooks = await response.json();
    filteredBooks = [...allBooks];
    
    // Remove loading indicators
    if (skeletons) skeletons.remove();
    if (loadingText) loadingText.remove();
    
    // Render
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => resetAndRender(), { timeout: 1000 });
    } else {
      requestAnimationFrame(() => resetAndRender());
    }
  } catch (error) {
    console.error('Fetch error:', error);
    grid.innerHTML = '<div class="error" style="grid-column: 1/-1; text-align: center; color: red;">⚠️ Could not load library. Please refresh.</div>';
  }
};

const loadStorage = () => {
  try {
    const storedFavs = localStorage.getItem('aklatell_favorites');
    if (storedFavs) favorites = JSON.parse(storedFavs);
    
    const storedTheme = localStorage.getItem('aklatell_theme');
    if (storedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      updateThemeIcons(true);
    }
  } catch (e) { console.error('Storage error:', e); }
  updateFavCount();
};

const renderBatch = () => {
  const grid = document.getElementById('booksGrid');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  
  const fragment = document.createDocumentFragment();
  const nextBatch = filteredBooks.slice(renderedCount, renderedCount + ITEMS_PER_PAGE);
  
  if (nextBatch.length === 0 && renderedCount === 0) {
    grid.innerHTML = '<div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 3rem;">📖 No books match your search.</div>';
    loadMoreBtn.style.display = 'none';
    return;
  }
  
  nextBatch.forEach(book => {
    const isFav = favorites.includes(book.id);
    const card = document.createElement('article');
    card.className = 'book-card';
    
    card.innerHTML = `
      <a href="${book.link}" class="card-link-overlay" aria-label="Read ${escapeHtml(book.title)}"></a>
      <button class="favorite-btn ${isFav ? 'active' : ''}" 
              data-id="${book.id}"
              aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}"
              aria-pressed="${isFav}">
        ${isFav ? '❤️' : '🤍'}
      </button>
      <div class="book-emoji" aria-hidden="true">${book.emoji}</div>
      <h2 class="head3" class="book-title">${escapeHtml(book.title)}</h2>
      <p class="book-author">${escapeHtml(book.author)}</p>
      <p class="book-preview">${escapeHtml(book.preview)}</p>
    `;
    
    fragment.appendChild(card);
  });
  
  requestAnimationFrame(() => {
    grid.appendChild(fragment);
    renderedCount += nextBatch.length;
    loadMoreBtn.style.display = renderedCount >= filteredBooks.length ? 'none' : 'block';
  });
};

const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const resetAndRender = () => {
  const grid = document.getElementById('booksGrid');
  grid.innerHTML = '';
  renderedCount = 0;
  renderBatch();
};

const applyFilters = (searchTerm) => {
  let result = allBooks;
  
  if (currentFilter === 'favorites') {
    result = result.filter(b => favorites.includes(b.id));
  }
  
  if (searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    result = result.filter(b =>
      b.title.toLowerCase().includes(lowerSearch) ||
      b.author.toLowerCase().includes(lowerSearch)
    );
  }
  
  const sortBy = document.getElementById('sortSelect').value;
  if (sortBy === 'title') {
    result.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === 'author') {
    result.sort((a, b) => a.author.localeCompare(b.author));
  } else if (sortBy === 'newest') {
    result.sort((a, b) => b.id - a.id);
  }
  
  filteredBooks = result;
  resetAndRender();
};

const toggleTheme = () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  updateThemeIcons(isDark);
  localStorage.setItem('aklatell_theme', isDark ? 'dark' : 'light');
};

const updateThemeIcons = (isDark) => {
  const icon = isDark ? '☀️' : '🌙';
  const text = isDark ? 'Toggle Light Mode' : 'Toggle Dark Mode';
  
  // Update Desktop Button
  const desktopBtn = document.getElementById('themeToggle');
  if (desktopBtn) {
    desktopBtn.innerHTML = `<span class="icon">${icon}</span> ${text}`;
  }
  
  // Update Mobile Button
  const mobileBtn = document.getElementById('mobileThemeToggle');
  if (mobileBtn) mobileBtn.textContent = icon;
};

const setupEventListeners = () => {
  document.getElementById('loadMoreBtn').addEventListener('click', renderBatch, { passive: true });
  
  let searchTimeout;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      applyFilters(e.target.value.toLowerCase());
    }, 300);
  }, { passive: true });
  
  document.getElementById('sortSelect').addEventListener('change', () => {
    applyFilters(document.getElementById('searchInput').value.toLowerCase());
  });
  
  // Use a common class 'toolbar-actions' to catch clicks from both desktop and mobile layouts if needed
  // Note: In HTML, the filter buttons are inside .filter-group
  const filterGroups = document.querySelectorAll('.filter-group');
  filterGroups.forEach(group => {
    group.addEventListener('click', (e) => {
      // Handle click on the button or the span inside it
      const btn = e.target.closest('.filter-chip');
      if (btn) {
        document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
        // If we have multiple filter groups (mobile/desktop), activate matching buttons in both
        const filterType = btn.dataset.filter;
        document.querySelectorAll(`.filter-chip[data-filter="${filterType}"]`).forEach(c => c.classList.add('active'));
        
        currentFilter = filterType;
        applyFilters(document.getElementById('searchInput').value.toLowerCase());
      }
    });
  });
  
  document.getElementById('booksGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('.favorite-btn');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const bookId = parseInt(btn.dataset.id);
      toggleFavorite(bookId);
    }
  });
  
  // Theme Toggles
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  const mobileThemeToggle = document.getElementById('mobileThemeToggle');
  if (mobileThemeToggle) mobileThemeToggle.addEventListener('click', toggleTheme);
  
  // Modal Logic
  const menuModal = document.getElementById('menuModal');
  const openMenu = () => menuModal.classList.add('active');
  const closeMenu = () => menuModal.classList.remove('active');
  
  // Trigger from both desktop (hidden) and mobile buttons if they exist
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMenu);
  
  document.getElementById('closeModal').addEventListener('click', closeMenu);
  menuModal.addEventListener('click', (e) => {
    if (e.target === menuModal) closeMenu();
  });
};

const toggleFavorite = (id) => {
  const index = favorites.indexOf(id);
  if (index === -1) favorites.push(id);
  else favorites.splice(index, 1);
  
  localStorage.setItem('aklatell_favorites', JSON.stringify(favorites));
  updateFavCount();
  
  // Update UI immediately for all buttons matching this ID
  const buttons = document.querySelectorAll(`.favorite-btn[data-id="${id}"]`);
  buttons.forEach(btn => {
    const isFav = favorites.includes(id);
    btn.classList.toggle('active', isFav);
    btn.textContent = isFav ? '❤️' : '🤍';
    btn.setAttribute('aria-pressed', isFav);
  });
  
  if (currentFilter === 'favorites') {
    applyFilters(document.getElementById('searchInput').value.toLowerCase());
  }
};

const updateFavCount = () => {
  const countSpan = document.getElementById('favCount');
  if (countSpan) countSpan.textContent = favorites.length;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}