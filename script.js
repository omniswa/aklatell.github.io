let allBooks = [];
let filteredBooks = [];
let favorites = [];
let renderedCount = 0;
const ITEMS_PER_PAGE = 100;
let currentFilter = 'all';

const init = async () => {
  loadStorage();
  setupEventListeners();
  await fetchBooks();
};

const fetchBooks = async () => {
  const grid = document.getElementById('booksGrid');
  
  try {
    const response = await fetch('books.json');
    if (!response.ok) throw new Error('Failed to load books');
    
    const data = await response.json();
    
    // 🔒 JSON ORDER IS NOW IRRELEVANT
    allBooks = data
      .map(b => ({
        ...b,
        id: Number(b.id) // normalize ID type
      }))
      .sort((a, b) => b.id - a.id); // canonical order = newest first
    
    // Never copy JSON order again
    applyFilters('');
    
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div class="error">Failed to load books</div>';
  }
};

const loadStorage = () => {
  try {
    const storedFavs = localStorage.getItem('aklatell_favorites');
    if (storedFavs) favorites = JSON.parse(storedFavs);
    
    const storedTheme = localStorage.getItem('aklatell_theme');
    if (storedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      updateThemeIcons(true); // Fixed: Pass boolean true, not !0 for clarity
    }
  } catch (e) {
    console.error('Storage error:', e);
    // If storage is corrupt, reset it to avoid persistent errors
    localStorage.removeItem('aklatell_favorites');
  }
  updateFavCount();
};

const HEART_ICON = `
<svg class="icon-svg" viewBox="0 0 24 24">
  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06
           a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06
           L12 21.23l7.78-7.78 1.06-1.06
           a5.5 5.5 0 0 0 0-7.78z"></path>
</svg>`;

const renderBatch = () => {
  const grid = document.getElementById('booksGrid');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  
  const nextBatch = filteredBooks.slice(
    renderedCount,
    renderedCount + ITEMS_PER_PAGE
  );
  
  // Empty state
  if (nextBatch.length === 0 && renderedCount === 0) {
    grid.innerHTML = `
      <div class="no-results" style="grid-column:1/-1; text-align:center; padding:3rem;">
        📖 No books match your search.
      </div>
    `;
    loadMoreBtn.style.display = 'none';
    return;
  }
  
  const fragment = document.createDocumentFragment();
  
  nextBatch.forEach(book => {
    const isFav = favorites.includes(book.id);
    const title = escapeHtml(book.title);
    const author = escapeHtml(book.author);
    const preview = escapeHtml(book.preview);
    const emoji = book.emoji || '📖';
    
    const card = document.createElement('article');
    card.className = 'book-card';
    
    card.innerHTML = `
      <a
        href="${book.link || '#'}"
        class="card-link-overlay"
        aria-label="Read ${title}"
      ></a>

      <button
        class="favorite-btn ${isFav ? 'active' : ''}"
        data-id="${book.id}"
        aria-pressed="${isFav}"
        aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}"
      >
        ${HEART_ICON}
      </button>

      <div class="book-visual">
        <div class="book-visual-inner">
          ${
            book.image
              ? `<img
                  src="${book.image}"
                  alt="${title} cover"
                  class="book-cover"
                  loading="lazy"
                >`
              : ''
          }
          <div class="book-emoji">${emoji}</div>
        </div>
      </div>

      <h2 class="head3 book-title">${title}</h2>
      <p class="book-author">${author}</p>
      <p class="book-preview">${preview}</p>
    `;
    
    fragment.appendChild(card);
  });
  
  // Single paint
  requestAnimationFrame(() => {
    grid.appendChild(fragment);
    renderedCount += nextBatch.length;
    loadMoreBtn.style.display =
      renderedCount >= filteredBooks.length ? 'none' : 'block';
    
    // Handle broken images → emoji fallback
    grid.querySelectorAll('img.book-cover').forEach(img => {
      img.addEventListener('error', () => img.remove(), { once: true });
    });
  });
};

// Fixed: Much faster than creating DOM elements for every string
const escapeHtml = (text) => {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const resetAndRender = () => {
  const grid = document.getElementById('booksGrid');
  grid.innerHTML = '';
  renderedCount = 0;
  renderBatch();
};

const applyFilters = (searchTerm) => {
  let result = [...allBooks]; // always clone
  
  if (currentFilter === 'favorites') {
    result = result.filter(b => favorites.includes(b.id));
  }
  
  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    result = result.filter(b =>
      b.title?.toLowerCase().includes(q) ||
      b.author?.toLowerCase().includes(q)
    );
  }
  
  const sortBy = document.getElementById('sortSelect').value;
  
  switch (sortBy) {
    case 'title':
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'author':
      result.sort((a, b) => a.author.localeCompare(b.author));
      break;
    case 'newest':
    default:
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
  const sunSvg = `<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const moonSvg = `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  const icon = isDark ? sunSvg : moonSvg;
  const text = isDark ? 'Toggle Light Mode' : 'Toggle Dark Mode';
  
  const desktopBtn = document.getElementById('themeToggle');
  if (desktopBtn) {
    desktopBtn.innerHTML = `<span class="icon">${icon}</span> ${text}`;
  }
  
  const mobileBtn = document.getElementById('mobileThemeToggle');
  if (mobileBtn) mobileBtn.innerHTML = icon;
};

const setupEventListeners = () => {
  const loadMore = document.getElementById('loadMoreBtn');
  if (loadMore) {
    loadMore.addEventListener('click', renderBatch, { passive: true });
  }
  
  let searchTimeout;
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        applyFilters(e.target.value.toLowerCase());
      }, 300);
    }, { passive: true });
  }
  
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      applyFilters(document.getElementById('searchInput').value.toLowerCase());
    });
  }
  
  const filterGroups = document.querySelectorAll('.filter-group');
  filterGroups.forEach(group => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-chip');
      if (btn) {
        document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
        const filterType = btn.dataset.filter;
        // Use attribute selector carefully to target all matching chips
        document.querySelectorAll(`.filter-chip[data-filter="${filterType}"]`).forEach(c => c.classList.add('active'));
        currentFilter = filterType;
        applyFilters(document.getElementById('searchInput').value.toLowerCase());
      }
    });
  });
  
  const booksGrid = document.getElementById('booksGrid');
  if (booksGrid) {
    booksGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.favorite-btn');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const bookId = parseInt(btn.dataset.id);
        toggleFavorite(bookId);
      }
    });
  }
  
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  
  const mobileThemeToggle = document.getElementById('mobileThemeToggle');
  if (mobileThemeToggle) mobileThemeToggle.addEventListener('click', toggleTheme);
  
  const menuModal = document.getElementById('menuModal');
  const openMenu = () => menuModal.classList.add('active');
  const closeMenu = () => menuModal.classList.remove('active');
  
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMenu);
  
  const closeModalBtn = document.getElementById('closeModal');
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeMenu);
  
  if (menuModal) {
    menuModal.addEventListener('click', (e) => {
      if (e.target === menuModal) closeMenu();
    });
  }
};

const toggleFavorite = (id) => {
  const index = favorites.indexOf(id);
  if (index === -1) favorites.push(id);
  else favorites.splice(index, 1);
  
  localStorage.setItem('aklatell_favorites', JSON.stringify(favorites));
  updateFavCount();
  
  const buttons = document.querySelectorAll(`.favorite-btn[data-id="${id}"]`);
  buttons.forEach(btn => {
    const isFav = favorites.includes(id);
    btn.classList.toggle('active', isFav);
    btn.setAttribute('aria-pressed', isFav);
  });
  
  // If we are currently viewing only favorites, re-run filter to remove un-favorited item immediately
  if (currentFilter === 'favorites') {
    applyFilters(document.getElementById('searchInput').value.toLowerCase());
  }
};

const updateFavCount = () => {
  const countSpan = document.getElementById('favCount');
  if (countSpan) countSpan.textContent = ` ${favorites.length}`;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}