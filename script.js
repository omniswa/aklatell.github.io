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

// Fetch books with optimized error handling
const fetchBooks = async () => {
  const grid = document.getElementById('booksGrid');
  const loadingEl = grid.querySelector('.loading');
  
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
    
    // Update loading state
    if (loadingEl) {
      loadingEl.setAttribute('aria-busy', 'false');
      loadingEl.textContent = 'Rendering books...';
    }
    
    // Use requestIdleCallback for non-critical rendering if available
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => resetAndRender(), { timeout: 1000 });
    } else {
      requestAnimationFrame(() => resetAndRender());
    }
  } catch (error) {
    console.error('Fetch error:', error);
    grid.innerHTML = '<div class="error" role="alert">⚠️ Could not load books. Please refresh the page.</div>';
  }
};

// Load from localStorage with error handling
const loadStorage = () => {
  try {
    const storedFavs = localStorage.getItem('aklatell_favorites');
    if (storedFavs) favorites = JSON.parse(storedFavs);
    
    const storedTheme = localStorage.getItem('aklatell_theme');
    if (storedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      document.getElementById('themeToggle').textContent = '☀️';
    }
  } catch (e) {
    console.error('Storage error:', e);
  }
  updateFavCount();
};

// Optimized batch rendering with DocumentFragment
const renderBatch = () => {
  const grid = document.getElementById('booksGrid');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const loading = grid.querySelector('.loading');
  
  if (loading) loading.remove();
  
  const fragment = document.createDocumentFragment();
  const nextBatch = filteredBooks.slice(renderedCount, renderedCount + ITEMS_PER_PAGE);
  
  if (nextBatch.length === 0 && renderedCount === 0) {
    grid.innerHTML = '<div class="no-results" role="status">📖 – No books found.</div>';
    loadMoreBtn.style.display = 'none';
    return;
  }
  
  nextBatch.forEach(book => {
    const isFav = favorites.includes(book.id);
    const card = document.createElement('article');
    card.className = 'book-card';
    
    // Use template literals for better performance
    card.innerHTML = `
      <a href="${book.link}" class="card-link-overlay" aria-label="Read ${escapeHtml(book.title)}"></a>
      <button class="favorite-btn ${isFav ? 'active' : ''}" 
              data-id="${book.id}"
              aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}"
              aria-pressed="${isFav}">
        ${isFav ? '❤️' : '🤍'}
      </button>
      <span class="book-emoji" aria-hidden="true">${book.emoji}</span>
      <h3 class="book-title">${escapeHtml(book.title)}</h3>
      <p class="book-author">by ${escapeHtml(book.author)}</p>
      <p class="book-preview">${escapeHtml(book.preview)}</p>
    `;
    
    fragment.appendChild(card);
  });
  
  // Batch DOM update
  requestAnimationFrame(() => {
    grid.appendChild(fragment);
    renderedCount += nextBatch.length;
    
    // Update load more button visibility
    loadMoreBtn.style.display = renderedCount >= filteredBooks.length ? 'none' : 'block';
    loadMoreBtn.setAttribute('aria-label', `Load ${Math.min(ITEMS_PER_PAGE, filteredBooks.length - renderedCount)} more books`);
  });
};

// Escape HTML to prevent XSS
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Reset grid and render first batch
const resetAndRender = () => {
  const grid = document.getElementById('booksGrid');
  grid.innerHTML = '';
  renderedCount = 0;
  renderBatch();
};

// Apply filters and sorting
const applyFilters = (searchTerm) => {
  let result = allBooks;
  
  // Filter by favorites
  if (currentFilter === 'favorites') {
    result = result.filter(b => favorites.includes(b.id));
  }
  
  // Filter by search term
  if (searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    result = result.filter(b =>
      b.title.toLowerCase().includes(lowerSearch) ||
      b.author.toLowerCase().includes(lowerSearch)
    );
  }
  
  // Sort results
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

// Setup all event listeners
const setupEventListeners = () => {
  // Load more button
  document.getElementById('loadMoreBtn').addEventListener('click', renderBatch, { passive: true });
  
  // Search with debouncing
  let searchTimeout;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      applyFilters(e.target.value.toLowerCase());
    }, 300);
  }, { passive: true });
  
  // Sort select
  document.getElementById('sortSelect').addEventListener('change', () => {
    applyFilters(document.getElementById('searchInput').value.toLowerCase());
  });
  
  // Filter chips (event delegation)
  document.querySelector('.toolbar-actions').addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-chip')) {
      document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
      });
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      applyFilters(document.getElementById('searchInput').value.toLowerCase());
    }
  });
  
  // Favorite buttons (event delegation)
  document.getElementById('booksGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('.favorite-btn');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      
      const bookId = parseInt(btn.dataset.id);
      toggleFavorite(bookId);
      
      const isFav = favorites.includes(bookId);
      
      // Update button state
      requestAnimationFrame(() => {
        btn.classList.toggle('active', isFav);
        btn.textContent = isFav ? '❤️' : '🤍';
        btn.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Add to favorites');
        btn.setAttribute('aria-pressed', isFav);
      });
    }
  });
  
  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    
    requestAnimationFrame(() => {
      document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';
    });
    
    // Debounce localStorage write
    setTimeout(() => {
      try {
        localStorage.setItem('aklatell_theme', isDark ? 'dark' : 'light');
      } catch (e) {
        console.error('Failed to save theme:', e);
      }
    }, 100);
  }, { passive: true });
  
  // Modal controls
  const menuModal = document.getElementById('menuModal');
  
  document.getElementById('menuBtn').addEventListener('click', () => {
    requestAnimationFrame(() => {
      menuModal.classList.add('active');
      // Focus first menu item for accessibility
      const firstMenuItem = menuModal.querySelector('.menu-item');
      if (firstMenuItem) firstMenuItem.focus();
    });
  }, { passive: true });
  
  document.getElementById('closeModal').addEventListener('click', () => {
    requestAnimationFrame(() => {
      menuModal.classList.remove('active');
      // Return focus to menu button
      document.getElementById('menuBtn').focus();
    });
  }, { passive: true });
  
  // Close modal on backdrop click
  menuModal.addEventListener('click', (e) => {
    if (e.target === menuModal) {
      requestAnimationFrame(() => {
        menuModal.classList.remove('active');
        document.getElementById('menuBtn').focus();
      });
    }
  });
  
  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuModal.classList.contains('active')) {
      menuModal.classList.remove('active');
      document.getElementById('menuBtn').focus();
    }
  });
};

// Toggle favorite with debounced localStorage
let storageTimeout;
const toggleFavorite = (id) => {
  const index = favorites.indexOf(id);
  if (index === -1) {
    favorites.push(id);
  } else {
    favorites.splice(index, 1);
  }
  
  // Debounce localStorage write
  clearTimeout(storageTimeout);
  storageTimeout = setTimeout(() => {
    try {
      localStorage.setItem('aklatell_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }, 100);
  
  updateFavCount();
  
  // Re-filter if showing favorites
  if (currentFilter === 'favorites') {
    applyFilters(document.getElementById('searchInput').value.toLowerCase());
  }
};

// Update favorites count
const updateFavCount = () => {
  requestAnimationFrame(() => {
    document.getElementById('favCount').textContent = favorites.length;
  });
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}