/**
 * ============================================================================
 * TRIDIMENSIONAL CREATION PVT LTD — SCROLL ANIMATIONS & MOTION (animations.js)
 * Lightweight IntersectionObserver system for performant viewport reveals
 * ============================================================================
 */

(function () {
  'use strict';

  /**
   * Initializes IntersectionObserver for elements with animated classes:
   * .animate-on-scroll, .fade-in, .slide-up
   */
  function initScrollAnimations() {
    // Check for IntersectionObserver support
    if (!('IntersectionObserver' in window)) {
      // Fallback for legacy environments: reveal all elements immediately
      const elements = document.querySelectorAll('.animate-on-scroll, .fade-in, .slide-up');
      elements.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    const observerOptions = {
      root: null, // viewport
      rootMargin: '0px 0px -50px 0px', // trigger slightly before or right as element enters
      threshold: 0.15 // 15% visibility triggers the reveal
    };

    const revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Once animated, stop observing this element for smooth performance
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Target elements explicitly marked for scroll reveals
    const animatables = document.querySelectorAll('.animate-on-scroll, .fade-in, .slide-up');
    animatables.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  // Execute after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
  } else {
    initScrollAnimations();
  }
})();
