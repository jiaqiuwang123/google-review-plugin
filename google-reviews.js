// google-reviews.js - Custom Google Reviews component

class GoogleReviews extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Default configuration
    this.config = {
      apiUrl: 'https://your-cloud-run-service.run.app/api/google-reviews',
      maxReviews: 10,
      showReviewText: true,
      reviewsPerPage: 5,
      reviewCardBackgroundColor: '#f7f7f7',
      reviewCardTextColor: '#333',
      reviewCardBorderRadius: '8px',
      reviewCardMargin: '10px',
      reviewCardPadding: '20px',
      reviewCardShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      starColor: '#FFC107',
      reviewTextMaxHeight: '100px',
      animationSpeed: 300,
      autoplay: true,
      autoplayInterval: 5000,
      responsive: true
    };
    
    // Styles
    this.styles = `
      :host {
        display: block;
        font-family: Arial, sans-serif;
        --star-color: ${this.config.starColor};
      }
      
      .google-reviews-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
      }
      
      .google-reviews-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 20px;
        background-color: #f1f1f1;
        border-radius: 8px 8px 0 0;
        margin-bottom: 10px;
      }
      
      .google-logo {
        display: flex;
        align-items: center;
      }
      
      .google-logo img {
        height: 24px;
        margin-right: 10px;
      }
      
      .overall-rating {
        display: flex;
        align-items: center;
      }
      
      .rating-value {
        font-size: 24px;
        font-weight: bold;
        margin-right: 10px;
      }
      
      .stars {
        display: flex;
        align-items: center;
      }
      
      .review-count {
        color: #666;
        margin-left: 10px;
        font-size: 14px;
      }
      
      .google-reviews-action {
        background-color: #4285F4;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        text-decoration: none;
        font-weight: bold;
        font-size: 14px;
        border: none;
        cursor: pointer;
      }
      
      .google-reviews-carousel {
        position: relative;
        overflow: hidden;
      }
      
      .google-reviews-track {
        display: flex;
        transition: transform ${this.config.animationSpeed}ms ease;
      }
      
      .google-review-card {
        flex: 0 0 calc(100% / ${this.config.reviewsPerPage});
        min-width: 250px;
        box-sizing: border-box;
        background-color: ${this.config.reviewCardBackgroundColor};
        color: ${this.config.reviewCardTextColor};
        border-radius: ${this.config.reviewCardBorderRadius};
        margin: ${this.config.reviewCardMargin};
        padding: ${this.config.reviewCardPadding};
        box-shadow: ${this.config.reviewCardShadow};
      }
      
      .google-review-author {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .author-image {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        margin-right: 10px;
        object-fit: cover;
      }
      
      .author-name {
        font-weight: bold;
      }
      
      .review-time {
        font-size: 12px;
        color: #777;
        margin-top: 2px;
      }
      
      .google-review-rating {
        margin-bottom: 10px;
      }
      
      .google-review-text {
        font-size: 14px;
        line-height: 1.5;
        overflow: hidden;
        text-overflow: ellipsis;
        max-height: ${this.config.reviewTextMaxHeight};
        transition: max-height 0.3s ease;
      }
      
      .google-review-text.expanded {
        max-height: 500px;
      }
      
      .read-more {
        color: #4285F4;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        margin-top: 8px;
        display: inline-block;
      }
      
      .carousel-controls {
        display: flex;
        justify-content: center;
        margin-top: 20px;
      }
      
      .carousel-button {
        background-color: #ddd;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 5px;
        cursor: pointer;
      }
      
      .carousel-button:hover {
        background-color: #ccc;
      }
      
      .carousel-dots {
        display: flex;
        justify-content: center;
        margin-top: 10px;
      }
      
      .carousel-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #ddd;
        margin: 0 5px;
        cursor: pointer;
      }
      
      .carousel-dot.active {
        background-color: #4285F4;
      }
      
      .page-indicator {
        text-align: center;
        font-size: 12px;
        color: #666;
        margin-top: 5px;
      }
      
      .load-more {
        display: block;
        margin: 20px auto;
        padding: 8px 16px;
        background-color: #f1f1f1;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        color: #333;
        font-weight: bold;
      }
      
      .load-more:hover {
        background-color: #e5e5e5;
      }
      
      .star {
        color: var(--star-color);
        font-size: 18px;
      }
      
      @media screen and (max-width: 768px) {
        .google-review-card {
          flex: 0 0 100%;
        }
        
        .google-reviews-header {
          flex-direction: column;
          text-align: center;
        }
        
        .overall-rating {
          margin-bottom: 10px;
        }
      }
    `;
    
    // Initial render
    this.render();
  }
  
  connectedCallback() {
    // Get configuration from attributes
    this.parseAttributes();
    
    // Fetch reviews
    this.fetchReviews();
    
    // Set up carousel autoplay if enabled
    if (this.config.autoplay) {
      this.startAutoplay();
    }
    
    // Set up responsive handling
    if (this.config.responsive) {
      window.addEventListener('resize', this.handleResize.bind(this));
      // Initial call to set correct number of visible reviews
      this.handleResize();
    }
  }
  
  disconnectedCallback() {
    // Clean up event listeners
    this.stopAutoplay();
    window.removeEventListener('resize', this.handleResize.bind(this));
  }
  
  parseAttributes() {
    // Parse all data attributes
    Array.from(this.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        const key = attr.name.replace('data-', '').replace(/-([a-z])/g, g => g[1].toUpperCase());
        
        // Try to parse as JSON if possible
        try {
          this.config[key] = JSON.parse(attr.value);
        } catch (e) {
          // If not valid JSON, use the raw value
          this.config[key] = attr.value;
        }
      }
    });
    
    // Update styles with new configuration
    this.updateStyles();
  }
  
  updateStyles() {
    // Get the style element and update its content
    const styleElement = this.shadowRoot.querySelector('style');
    if (styleElement) {
      styleElement.textContent = this.styles;
    }
  }
  
  async fetchReviews() {
    try {
      // Show loading state
      this.shadowRoot.querySelector('.google-reviews-container').innerHTML = '<div style="text-align: center; padding: 20px;">Loading reviews...</div>';
      
      // Fetch reviews from backend
      const response = await fetch(this.config.apiUrl);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Store reviews with fallback values
      this.reviews = (data.reviews || []).slice(0, this.config.maxReviews);
      this.rating = data.rating || 0;
      this.reviewCount = data.user_ratings_total || 0;
      this.businessName = data.name || 'Business';
      
      // Re-render with fetched data
      this.render();
      
      // Set up event listeners after rendering
      this.setupEventListeners();
      
      // Initialize carousel
      this.initCarousel();
      
    } catch (error) {
      console.error('Error fetching Google reviews:', error);
      this.shadowRoot.querySelector('.google-reviews-container').innerHTML = `
        <div style="text-align: center; padding: 20px; color: #d32f2f;">
          Failed to load reviews. Please try again later.
        </div>
      `;
    }
  }
  
  render() {
    // Create shadow DOM content
    this.shadowRoot.innerHTML = `
      <style>${this.styles}</style>
      <div class="google-reviews-container">
        ${this.reviews ? this.renderReviews() : '<div style="text-align: center; padding: 20px;">Loading reviews...</div>'}
      </div>
    `;
  }
  
  renderReviews() {
    // Handle case with no reviews
    if (!this.reviews || this.reviews.length === 0) {
      return `
        <div class="google-reviews-header">
          <div class="google-logo">
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAxMDAgMzIiPjxwYXRoIGZpbGw9IiM0Mjg1RjQiIGQ9Ik0zNS41IDIwLjJjMCAzLjYtMi44IDYuMi02LjMgNi4ycy02LjMtMi42LTYuMy02LjJjMC0zLjYgMi44LTYuMiA2LjMtNi4yIDMuNSAwIDYuMyAyLjYgNi4zIDYuMnptLTIuOCAwYzAtMi4yLTEuNi0zLjgtMy41LTMuOC0xLjkgMC0zLjUgMS41LTMuNSAzLjggMCAyLjIgMS42IDMuOCAzLjUgMy44IDEuOSAtLjEgMy41LTEuNiAzLjUtMy44em0xNi45LTQuOHY5LjRoLTIuN3YtLjljLS43LjctMS43IDEuMS0zIDEuMS0yLjggMC01LTIuMi01LTUuMnMyLjMtNS4yIDUtNS4yYzEuMiAwIDIuMy41IDMgMS4xdi0uOWgyLjd6bS0yLjYgNC42YzAtMS42LTEuMS0yLjgtMi43LTIuOC0xLjYgMC0yLjcgMS4yLTIuNyAyLjggMCAxLjYgMS4xIDIuNyAyLjcgMi43IDEuNiAwIDIuNy0xLjEgMi43LTIuN3ptMTAuOC00LjhjMi45IDAgNS4zIDIuMiA1LjMgNS4ycy0yLjQgNS4yLTUuMyA1LjJjLTEuMiAwLTIuMy0uNC0zLTEuMXYuOWgtMi43VjEwLjZoMi43djQuN2MuNy0uNiAxLjctMS4xIDN6bTAgNy45YzEuNiAwIDIuNy0xLjEgMi43LTIuN3MtMS4xLTIuOC0yLjctMi44Yy0xLjYgMC0yLjcgMS4yLTIuNyAyLjggMCAxLjYgMS4xIDIuNyAyLjcgMi43em0xMy4yLTguMWwtMy45IDkuOGMtLjkgMi4xLTIuMyAyLjgtNC40IDIuNnYtMi4zYzEuMiAwIDEuOC0uNCAxLjktMS4yTDY2IDEyLjFoMy14bTExLjUgMy43YzAgMy41LTIuNyA2LjItNi4xIDYuMi0zLjQgMC02LjEtMi43LTYuMS02LjJzMi43LTYuMiA2LjEtNi4yYzMuNCAwIDYuMSAyLjcgNi4xIDYuMnptLTIuNyAwYzAtMi0xLjQtMy42LTMuNS0zLjZzLTMuNSAxLjYtMy41IDMuNiAxLjQgMy42IDMuNSAzLjYgMy41LTEuNiAzLjUtMy42em0xMC41IDIuOEw5NS44IDEyaDIuOWwtNC45IDEyLjNoLTIuOUw4NSAxMmgyLjlsNCAzLjkgNC0zLjl6Ii8+PHBhdGggZmlsbD0iI0VBNDMzNSIgZD0iTTEwLjUgNi45djIuOGg2LjljLS40IDEuNi0xLjQgMy0yLjkgMy45bDIuMiAyLjJjMS44LTEuOCAzLjEtNC41IDMuMS03LjYgMC0uNiAwLTEuMy0uMi0xLjloLTkuMXptLTYuNyA5LjljLS40LS42LS44LTEuMy0xLTJWMTVjLS4yLS45LS40LTEuOS0uNC0zcy4xLTIuMS40LTNjLjItLjcuNi0xLjQgMS0ybDIuNyAyLjVjLTEuNSAxLjItMiAyLjYtMiA0LjMgMCAxLjcuNiAzLjEgMiA0LjN6Ii8+PHBhdGggZmlsbD0iI0ZCQkMwNCIgZD0iTTEwLjUgMjIuN2M0LjYgMCA4LjQtMS42IDExLjItNC4zTDE5LjQgMTZjLTEuMSAxLTIuNiAxLjctNC45IDEuNy0zLjggMC03LTIuNi03LjYtNi4xTDQgMTQuNWMxLjUgNC42IDUuOCA4LjIgMTAuNSA4LjJ6Ii8+PHBhdGggZmlsbD0iIzM0QTg1MyIgZD0iTTEwLjUgNS4zYzIuMS4xIDQgMSA1LjQgMi4zbC0yLjQgMi40Yy0uOC0uOC0xLjktMS4zLTMuMS0xLjMtMy44IDAtNyAyLjYtNy42IDYuMWwtMi45LTIuM0M1LjUgNi45IDkuNyAzLjMgMTAuNSA1LjN6Ii8+PC9zdmc+" alt="Google" />
            <span>Reviews</span>
          </div>
          <div class="overall-rating">
            <span class="rating-value">${this.rating.toFixed(1)}</span>
            <div class="stars">
              ${this.renderStars(this.rating)}
            </div>
            <span class="review-count">(${this.reviewCount})</span>
          </div>
          <a href="https://search.google.com/local/writereview?placeid=${this.getPlaceIdFromUrl()}" target="_blank" class="google-reviews-action">
            Review us on Google
          </a>
        </div>
        <div style="text-align: center; padding: 40px; color: #666;">
          <p>No reviews available at the moment.</p>
          <p>Be the first to leave a review!</p>
        </div>
      `;
    }

    return `
      <div class="google-reviews-header">
        <div class="google-logo">
          <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAxMDAgMzIiPjxwYXRoIGZpbGw9IiM0Mjg1RjQiIGQ9Ik0zNS41IDIwLjJjMCAzLjYtMi44IDYuMi02LjMgNi4ycy02LjMtMi42LTYuMy02LjJjMC0zLjYgMi44LTYuMiA2LjMtNi4yIDMuNSAwIDYuMyAyLjYgNi4zIDYuMnptLTIuOCAwYzAtMi4yLTEuNi0zLjgtMy41LTMuOC0xLjkgMC0zLjUgMS41LTMuNSAzLjggMCAyLjIgMS42IDMuOCAzLjUgMy44IDEuOSAtLjEgMy41LTEuNiAzLjUtMy44em0xNi45LTQuOHY5LjRoLTIuN3YtLjljLS43LjctMS43IDEuMS0zIDEuMS0yLjggMC01LTIuMi01LTUuMnMyLjMtNS4yIDUtNS4yYzEuMiAwIDIuMy41IDMgMS4xdi0uOWgyLjd6bS0yLjYgNC42YzAtMS42LTEuMS0yLjgtMi43LTIuOC0xLjYgMC0yLjcgMS4yLTIuNyAyLjggMCAxLjYgMS4xIDIuNyAyLjcgMi43IDEuNiAwIDIuNy0xLjEgMi43LTIuN3ptMTAuOC00LjhjMi45IDAgNS4zIDIuMiA1LjMgNS4ycy0yLjQgNS4yLTUuMyA1LjJjLTEuMiAwLTIuMy0uNC0zLTEuMXYuOWgtMi43VjEwLjZoMi43djQuN2MuNy0uNiAxLjctMS4xIDN6bTAgNy45YzEuNiAwIDIuNy0xLjEgMi43LTIuN3MtMS4xLTIuOC0yLjctMi44Yy0xLjYgMC0yLjcgMS4yLTIuNyAyLjggMCAxLjYgMS4xIDIuNyAyLjcgMi43em0xMy4yLTguMWwtMy45IDkuOGMtLjkgMi4xLTIuMyAyLjgtNC40IDIuNnYtMi4zYzEuMiAwIDEuOC0uNCAxLjktMS4yTDY2IDEyLjFoMy14bTExLjUgMy43YzAgMy41LTIuNyA2LjItNi4xIDYuMi0zLjQgMC02LjEtMi43LTYuMS02LjJzMi43LTYuMiA2LjEtNi4yYzMuNCAwIDYuMSAyLjcgNi4xIDYuMnptLTIuNyAwYzAtMi0xLjQtMy42LTMuNS0zLjZzLTMuNSAxLjYtMy41IDMuNiAxLjQgMy42IDMuNSAzLjYgMy41LT1. 1IDMuNS0zLjZ6bTEwLjUgMi44TDk1LjggMTJoMi45bC00LjkgMTIuM2gtMi45TDg1IDEyaDIuOWw0IDMuOSA0LTMuOXoiLz48cGF0aCBmaWxsPSIjRUE0MzM1IiBkPSJNMTAuNSA2Ljl2Mi44aDYuOWMtLjQgMS42LTEuNCAzLTIuOSAzLjlsMi4yIDIuMmMxLjgtMS44IDMuMS00LjUgMy4xLTcuNiAwLS42IDAtMS4zLS4yLTEuOWgtOS4xem0tNi43IDkuOWMtLjQtLjYtLjgtMS4zLTEtMlYxNWMtLjItLjktLjQtMS45LS40LTNzLjEtMi4xLjQtM2MuMi0uNy42LTEuNCAxLTJsMi43IDIuNWMtMS41IDEuMi0yIDIuNi0yIDQuMyAwIDEuNy42IDMuMSAyIDQuM3oiLz48cGF0aCBmaWxsPSIjRkJCQzA0IiBkPSJNMTAuNSAyMi43YzQuNiAwIDguNC0xLjYgMTEuMi00LjNMMTkuNCAxNmMtMS4xIDEtMi42IDEuNy00LjkgMS43LTMuOCAwLTctMi42LTcuNi02LjFMNyAGTDQ1Yy4xNSA0LjYgNS44IDguMiAxMC41IDguMnoiLz48cGF0aCBmaWxsPSIjMzRBODUzIiBkPSJNMTAuNSA1LjNjMi4xLjEgNCAxIDUuNCAyLjNsLTIuNCAyLjRjLS44LS44LTEuOS0xLjMtMy4xLTEuMy0zLjggMC03IDIuNi03LjYgNi4xbC0yLjktMi4zQzUuNSA2LjkgOS43IDMuMyAxMC41IDUuM3oiLz48L3N2Zz4=" alt="Google" />
          <span>Reviews</span>
        </div>
        <div class="overall-rating">
          <span class="rating-value">${this.rating.toFixed(1)}</span>
          <div class="stars">
            ${this.renderStars(this.rating)}
          </div>
          <span class="review-count">(${this.reviewCount})</span>
        </div>
        <a href="https://search.google.com/local/writereview?placeid=${this.getPlaceIdFromUrl()}" target="_blank" class="google-reviews-action">
          Review us on Google
        </a>
      </div>
      
      <div class="google-reviews-carousel">
        <div class="google-reviews-track">
          ${this.reviews.map(review => this.renderReviewCard(review)).join('')}
        </div>
      </div>
      
      <div class="carousel-controls">
        <button class="carousel-button prev-button">❮</button>
        <button class="carousel-button next-button">❯</button>
      </div>
      
      <div class="carousel-dots">
        ${Array.from({ length: Math.ceil(this.reviews.length / this.config.reviewsPerPage) }, (_, i) => 
          `<div class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`
        ).join('')}
      </div>
      
      <div class="page-indicator">
        <span class="current-page">1</span> / <span class="total-pages">${Math.ceil(this.reviews.length / this.config.reviewsPerPage)}</span>
      </div>
    `;
  }
  
  renderReviewCard(review) {
    return `
      <div class="google-review-card">
        <div class="google-review-author">
          <img src="${review.profile_photo_url}" alt="${review.author_name}" class="author-image">
          <div>
            <div class="author-name">${review.author_name}</div>
            <div class="review-time">${review.relative_time_description}</div>
          </div>
        </div>
        <div class="google-review-rating">
          ${this.renderStars(review.rating)}
        </div>
        ${this.config.showReviewText ? `
          <div class="google-review-text">
            ${review.text || ''}
            ${review.text && review.text.length > 150 ? 
              `<span class="read-more">Read more</span>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return `
      ${Array(fullStars).fill('★').join('')}
      ${halfStar ? '★' : ''}
      ${Array(emptyStars).fill('☆').join('')}
    `.replace(/★/g, '<span class="star">★</span>').replace(/☆/g, '<span class="star" style="opacity: 0.3">★</span>');
  }
  
  setupEventListeners() {
    // Carousel navigation
    const prevButton = this.shadowRoot.querySelector('.prev-button');
    const nextButton = this.shadowRoot.querySelector('.next-button');
    const dots = this.shadowRoot.querySelectorAll('.carousel-dot');
    
    if (prevButton && nextButton) {
      prevButton.addEventListener('click', this.prevSlide.bind(this));
      nextButton.addEventListener('click', this.nextSlide.bind(this));
    }
    
    if (dots.length) {
      dots.forEach(dot => {
        dot.addEventListener('click', () => {
          this.goToSlide(parseInt(dot.dataset.index));
        });
      });
    }
    
    // Read more toggles
    const readMoreButtons = this.shadowRoot.querySelectorAll('.read-more');
    if (readMoreButtons.length) {
      readMoreButtons.forEach(button => {
        button.addEventListener('click', event => {
          const textElement = event.target.closest('.google-review-text');
          textElement.classList.toggle('expanded');
          event.target.textContent = textElement.classList.contains('expanded') ? 'Read less' : 'Read more';
        });
      });
    }
  }
  
  initCarousel() {
    this.currentSlide = 0;
    this.totalSlides = Math.ceil(this.reviews.length / this.config.reviewsPerPage);
    this.updateCarousel();
  }
  
  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
    this.updateCarousel();
    this.resetAutoplay();
  }
  
  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    this.updateCarousel();
    this.resetAutoplay();
  }
  
  goToSlide(index) {
    this.currentSlide = index;
    this.updateCarousel();
    this.resetAutoplay();
  }
  
  updateCarousel() {
    const track = this.shadowRoot.querySelector('.google-reviews-track');
    const dots = this.shadowRoot.querySelectorAll('.carousel-dot');
    const currentPage = this.shadowRoot.querySelector('.current-page');
    
    if (track) {
      const slideWidth = 100 / this.config.reviewsPerPage;
      track.style.transform = `translateX(-${this.currentSlide * slideWidth * this.config.reviewsPerPage}%)`;
    }
    
    if (dots.length) {
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === this.currentSlide);
      });
    }
    
    if (currentPage) {
      currentPage.textContent = this.currentSlide + 1;
    }
  }
  
  startAutoplay() {
    this.autoplayTimer = setInterval(() => {
      this.nextSlide();
    }, this.config.autoplayInterval);
  }
  
  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }
  
  resetAutoplay() {
    this.stopAutoplay();
    if (this.config.autoplay) {
      this.startAutoplay();
    }
  }
  
  handleResize() {
    const width = window.innerWidth;
    
    // Adjust reviewsPerPage based on screen width
    if (width < 480) {
      this.config.reviewsPerPage = 1;
    } else if (width < 768) {
      this.config.reviewsPerPage = 2;
    } else if (width < 992) {
      this.config.reviewsPerPage = 3;
    } else {
      this.config.reviewsPerPage = 5;
    }
    
    // Re-initialize carousel with new settings
    this.initCarousel();
  }
  
  getPlaceIdFromUrl() {
    // Extract place ID from API URL or use a default
    const urlMatch = this.config.apiUrl.match(/place_id=([^&]+)/);
    return urlMatch ? urlMatch[1] : '';
  }
}

// Register the custom element
customElements.define('google-reviews', GoogleReviews);

// Usage example:
// <google-reviews 
//   data-api-url="https://your-backend-url/api/google-reviews"
//   data-max-reviews="10"
//   data-reviews-per-page="5"
//   data-show-review-text="true"
//   data-star-color="#FFC107"
//   data-autoplay="true"
//   data-autoplay-interval="5000"
// ></google-reviews>