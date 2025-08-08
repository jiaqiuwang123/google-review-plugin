// Dynamic Google Reviews Widget with Admin Configuration Support
// This widget fetches its configuration from the admin dashboard

(function() {
  'use strict';
  
  // Default configuration (fallbacks if API fails)
  let CONFIG = {
    apiUrl: window.location.origin + '/api/google-reviews',
    configUrl: window.location.origin + '/api/config',
    maxReviews: 15,
    reviewsPerPage: 5,
    showReviewText: true,
    starColor: '#FFC107',
    autoplay: false,
    autoplayInterval: 5000,
    containerId: 'google-reviews-dynamic-widget'
  };

  let currentReviews = [];
  let currentSlide = 0;
  let totalSlides = 0;
  let autoplayTimer = null;

  // CSS styles template - will be updated with configuration
  const getStyles = (config) => `
    .gr-dynamic-container {
      font-family: Arial, sans-serif !important;
      max-width: 1200px !important;
      margin: 20px auto !important;
    }
    
    .gr-dynamic-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 15px 20px !important;
      background-color: #f8f9fa !important;
      border-radius: 8px !important;
      margin-bottom: 15px !important;
      flex-wrap: wrap !important;
      gap: 10px !important;
    }
    
    .gr-dynamic-logo {
      display: flex !important;
      align-items: center !important;
      font-weight: bold !important;
      font-size: 16px !important;
      color: #333 !important;
    }
    
    .gr-dynamic-rating {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
    }
    
    .gr-dynamic-rating-value {
      font-size: 24px !important;
      font-weight: bold !important;
      color: #333 !important;
    }
    
    .gr-dynamic-stars {
      display: flex !important;
    }
    
    .gr-dynamic-star {
      color: ${config.star_color || '#FFC107'} !important;
      font-size: 18px !important;
    }
    
    .gr-dynamic-count {
      color: #666 !important;
      font-size: 14px !important;
    }
    
    .gr-dynamic-button {
      background-color: #4285F4 !important;
      color: white !important;
      padding: 10px 16px !important;
      border-radius: 4px !important;
      text-decoration: none !important;
      font-weight: bold !important;
      font-size: 14px !important;
      transition: background-color 0.3s !important;
    }
    
    .gr-dynamic-button:hover {
      background-color: #3367d6 !important;
      color: white !important;
      text-decoration: none !important;
    }
    
    .gr-dynamic-carousel {
      position: relative !important;
      overflow: hidden !important;
      margin-bottom: 20px !important;
    }
    
    .gr-dynamic-track {
      display: flex !important;
      transition: transform 0.3s ease !important;
    }
    
    .gr-dynamic-grid {
      display: grid !important;
      grid-template-columns: repeat(${config.reviews_per_page || 5}, 1fr) !important;
      gap: 15px !important;
      min-width: 100% !important;
      flex-shrink: 0 !important;
    }
    
    .gr-dynamic-card {
      background-color: #fff !important;
      border: 1px solid #e1e5e9 !important;
      border-radius: 8px !important;
      padding: 20px !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
      transition: transform 0.2s, box-shadow 0.2s !important;
      min-height: 200px !important;
      display: flex !important;
      flex-direction: column !important;
    }
    
    .gr-dynamic-card:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    }
    
    .gr-dynamic-author {
      display: flex !important;
      align-items: center !important;
      margin-bottom: 12px !important;
    }
    
    .gr-dynamic-avatar {
      width: 40px !important;
      height: 40px !important;
      border-radius: 50% !important;
      margin-right: 12px !important;
      object-fit: cover !important;
      background: #eee !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      color: #999 !important;
      font-size: 16px !important;
    }
    
    .gr-dynamic-name {
      font-weight: bold !important;
      color: #333 !important;
      margin-bottom: 2px !important;
    }
    
    .gr-dynamic-time {
      font-size: 12px !important;
      color: #666 !important;
    }
    
    .gr-dynamic-review-rating {
      margin-bottom: 10px !important;
    }
    
    .gr-dynamic-text {
      font-size: 14px !important;
      line-height: 1.5 !important;
      color: #333 !important;
      flex-grow: 1 !important;
    }
    
    .gr-dynamic-text.clipped {
      max-height: 100px !important;
      overflow: hidden !important;
    }
    
    .gr-dynamic-more {
      color: #4285F4 !important;
      cursor: pointer !important;
      font-size: 12px !important;
      font-weight: bold !important;
      margin-top: 8px !important;
      display: inline-block !important;
    }
    
    .gr-dynamic-more:hover {
      text-decoration: underline !important;
    }
    
    .gr-dynamic-controls {
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      gap: 15px !important;
      margin-top: 20px !important;
    }
    
    .gr-dynamic-nav {
      background-color: #ddd !important;
      border: none !important;
      border-radius: 50% !important;
      width: 40px !important;
      height: 40px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      font-size: 18px !important;
      transition: background-color 0.3s !important;
    }
    
    .gr-dynamic-nav:hover {
      background-color: #ccc !important;
    }
    
    .gr-dynamic-nav:disabled {
      background-color: #eee !important;
      color: #999 !important;
      cursor: not-allowed !important;
    }
    
    .gr-dynamic-dots {
      display: flex !important;
      gap: 8px !important;
    }
    
    .gr-dynamic-dot {
      width: 10px !important;
      height: 10px !important;
      border-radius: 50% !important;
      background-color: #ddd !important;
      cursor: pointer !important;
      transition: background-color 0.3s !important;
    }
    
    .gr-dynamic-dot.active {
      background-color: #4285F4 !important;
    }
    
    .gr-dynamic-loading {
      text-align: center !important;
      padding: 40px !important;
      color: #666 !important;
      font-size: 16px !important;
    }
    
    .gr-dynamic-error {
      text-align: center !important;
      padding: 40px !important;
      color: #d32f2f !important;
      background-color: #ffebee !important;
      border-radius: 8px !important;
      margin: 20px 0 !important;
    }
    
    @media (max-width: 768px) {
      .gr-dynamic-header {
        flex-direction: column !important;
        text-align: center !important;
      }
      
      .gr-dynamic-grid {
        grid-template-columns: 1fr !important;
      }
      
      .gr-dynamic-controls {
        flex-direction: column !important;
        gap: 10px !important;
      }
    }
  `;

  async function loadConfiguration() {
    try {
      const response = await fetch(CONFIG.configUrl);
      if (response.ok) {
        const config = await response.json();
        // Merge with default CONFIG
        CONFIG = {
          ...CONFIG,
          maxReviews: config.max_reviews || CONFIG.maxReviews,
          reviewsPerPage: config.reviews_per_page || CONFIG.reviewsPerPage,
          showReviewText: config.show_review_text !== false,
          starColor: config.star_color || CONFIG.starColor,
          autoplay: config.autoplay === true,
          autoplayInterval: (config.autoplay_interval || CONFIG.autoplayInterval / 1000) * 1000
        };
        console.log('Configuration loaded:', CONFIG);
      }
    } catch (error) {
      console.warn('Failed to load configuration, using defaults:', error);
    }
  }

  async function initializeWidget() {
    // Load configuration first
    await loadConfiguration();
    
    // Inject styles with current configuration
    const styleSheet = document.createElement('style');
    styleSheet.textContent = getStyles(CONFIG);
    document.head.appendChild(styleSheet);
    
    const container = document.getElementById(CONFIG.containerId);
    if (!container) {
      console.error('Container not found:', CONFIG.containerId);
      return;
    }
    
    container.className = 'gr-dynamic-container';
    loadReviews();
  }

  async function loadReviews() {
    const container = document.getElementById(CONFIG.containerId);
    container.innerHTML = '<div class="gr-dynamic-loading">Loading Google Reviews... ⭐</div>';
    
    try {
      const response = await fetch(CONFIG.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      currentReviews = data.reviews || [];
      displayReviews(data);
      
    } catch (error) {
      console.error('Error loading reviews:', error);
      container.innerHTML = `
        <div class="gr-dynamic-error">
          <h3>Unable to load reviews</h3>
          <p>Error: ${error.message}</p>
        </div>
      `;
    }
  }

  function displayReviews(data) {
    const container = document.getElementById(CONFIG.containerId);
    const reviews = currentReviews.slice(0, CONFIG.maxReviews);
    const rating = data.rating || 0;
    const reviewCount = data.user_ratings_total || 0;
    const businessName = data.name || 'Business';
    
    if (reviews.length === 0) {
      container.innerHTML = `
        <div class="gr-dynamic-header">
          <div class="gr-dynamic-logo">
            <span style="color: #4285F4; font-size: 20px; margin-right: 8px;">⭐</span>
            <span>Google Reviews</span>
          </div>
          <div class="gr-dynamic-rating">
            <span class="gr-dynamic-rating-value">${rating.toFixed(1)}</span>
            <div class="gr-dynamic-stars">${renderStars(rating)}</div>
            <span class="gr-dynamic-count">(${reviewCount})</span>
          </div>
          <a href="https://search.google.com/local/writereview" target="_blank" class="gr-dynamic-button">
            Write a Review
          </a>
        </div>
        <div style="text-align: center; padding: 40px; color: #666;">
          <h3>${businessName}</h3>
          <p>No reviews available yet.</p>
          <p>Be the first to leave a review!</p>
        </div>
      `;
      return;
    }
    
    // Calculate carousel slides
    totalSlides = Math.ceil(reviews.length / CONFIG.reviewsPerPage);
    currentSlide = 0;
    
    const slidesHTML = [];
    for (let i = 0; i < totalSlides; i++) {
      const slideReviews = reviews.slice(i * CONFIG.reviewsPerPage, (i + 1) * CONFIG.reviewsPerPage);
      const reviewsHTML = slideReviews.map(review => renderReviewCard(review)).join('');
      slidesHTML.push(`<div class="gr-dynamic-grid">${reviewsHTML}</div>`);
    }
    
    container.innerHTML = `
      <div class="gr-dynamic-header">
        <div class="gr-dynamic-logo">
          <span style="color: #4285F4; font-size: 20px; margin-right: 8px;">⭐</span>
          <span>Google Reviews</span>
        </div>
        <div class="gr-dynamic-rating">
          <span class="gr-dynamic-rating-value">${rating.toFixed(1)}</span>
          <div class="gr-dynamic-stars">${renderStars(rating)}</div>
          <span class="gr-dynamic-count">(${reviewCount})</span>
        </div>
        <a href="https://search.google.com/local/writereview" target="_blank" class="gr-dynamic-button">
          Write a Review
        </a>
      </div>
      
      <div class="gr-dynamic-carousel">
        <div class="gr-dynamic-track" style="transform: translateX(0%)">
          ${slidesHTML.join('')}
        </div>
      </div>
      
      ${totalSlides > 1 ? `
        <div class="gr-dynamic-controls">
          <button class="gr-dynamic-nav" id="prevBtn">‹</button>
          <div class="gr-dynamic-dots">
            ${Array.from({ length: totalSlides }, (_, i) => 
              `<div class="gr-dynamic-dot ${i === 0 ? 'active' : ''}" data-slide="${i}"></div>`
            ).join('')}
          </div>
          <button class="gr-dynamic-nav" id="nextBtn">›</button>
        </div>
      ` : ''}
    `;
    
    setupEventListeners();
    if (CONFIG.autoplay && totalSlides > 1) {
      startAutoplay();
    }
  }

  function renderReviewCard(review) {
    const textContent = CONFIG.showReviewText && review.text ? review.text : '';
    const shouldClip = textContent.length > 150;
    
    return `
      <div class="gr-dynamic-card">
        <div class="gr-dynamic-author">
          <div class="gr-dynamic-avatar">
            ${review.profile_photo_url ? 
              `<img src="${review.profile_photo_url}" alt="${review.author_name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` :
              '👤'
            }
          </div>
          <div>
            <div class="gr-dynamic-name">${review.author_name}</div>
            <div class="gr-dynamic-time">${review.relative_time_description}</div>
          </div>
        </div>
        <div class="gr-dynamic-review-rating">${renderStars(review.rating)}</div>
        ${textContent ? `
          <div class="gr-dynamic-text ${shouldClip ? 'clipped' : ''}" data-full="${encodeURIComponent(textContent)}">
            ${shouldClip ? textContent.substring(0, 150) + '...' : textContent}
            ${shouldClip ? '<div class="gr-dynamic-more">Read more</div>' : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderStars(rating) {
    let html = '';
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const empty = 5 - fullStars - (hasHalf ? 1 : 0);
    
    for (let i = 0; i < fullStars; i++) html += '<span class="gr-dynamic-star">★</span>';
    if (hasHalf) html += '<span class="gr-dynamic-star">★</span>';
    for (let i = 0; i < empty; i++) html += '<span class="gr-dynamic-star" style="opacity:0.3">★</span>';
    return html;
  }

  function setupEventListeners() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dots = document.querySelectorAll('.gr-dynamic-dot');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateCarousel();
        resetAutoplay();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
        resetAutoplay();
      });
    }
    
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        currentSlide = parseInt(dot.dataset.slide);
        updateCarousel();
        resetAutoplay();
      });
    });
    
    // Read more functionality
    const readMoreButtons = document.querySelectorAll('.gr-dynamic-more');
    readMoreButtons.forEach(button => {
      button.addEventListener('click', function() {
        const textEl = this.parentNode;
        const fullText = decodeURIComponent(textEl.dataset.full);
        const isClipped = textEl.classList.contains('clipped');
        
        if (isClipped) {
          textEl.innerHTML = fullText + '<div class="gr-dynamic-more">Read less</div>';
          textEl.classList.remove('clipped');
        } else {
          textEl.innerHTML = fullText.substring(0, 150) + '...<div class="gr-dynamic-more">Read more</div>';
          textEl.classList.add('clipped');
        }
        
        // Re-add event listener
        const newButton = textEl.querySelector('.gr-dynamic-more');
        if (newButton) {
          newButton.addEventListener('click', arguments.callee);
        }
      });
    });
  }

  function updateCarousel() {
    const track = document.querySelector('.gr-dynamic-track');
    const dots = document.querySelectorAll('.gr-dynamic-dot');
    
    if (track) {
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
    
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentSlide);
    });
  }

  function startAutoplay() {
    autoplayTimer = setInterval(() => {
      currentSlide = (currentSlide + 1) % totalSlides;
      updateCarousel();
    }, CONFIG.autoplayInterval);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function resetAutoplay() {
    stopAutoplay();
    if (CONFIG.autoplay && totalSlides > 1) {
      startAutoplay();
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidget);
  } else {
    initializeWidget();
  }

  // Global function to manually initialize (useful for dynamic content)
  window.initGoogleReviewsWidget = initializeWidget;

})();

// Usage:
// 1. Include this script in your page
// 2. Add <div id="google-reviews-dynamic-widget"></div> where you want the widget
// 3. The widget will automatically load configuration from the admin dashboard