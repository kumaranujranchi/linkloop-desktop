/**
 * LinkBuild — Scroll & Stunning Animations System
 * Uses Motion One (vanilla sister of Framer Motion) and Lenis
 */

(function() {
  // 1. Enable CSS animations hook
  document.documentElement.classList.add('js-enabled');

  // Wait for resources to load
  window.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initLandingAnimations();
    initDashboardTransitions();
  });

  /**
   * Initialize Lenis Smooth Inertial Scrolling
   */
  function initSmoothScroll() {
    if (typeof Lenis === 'undefined') return;

    // Only run window smooth scrolling on non-dashboard pages
    if (!document.body.classList.contains('dashboard-body')) {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // premium exponential deceleration
        smoothWheel: true,
        smoothTouch: false,
        wheelMultiplier: 1.0,
      });

      // Connect Lenis to requestAnimationFrame
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      // Expose globally
      window._lenis = lenis;
      
      // Update Lenis on window resize
      window.addEventListener('resize', () => lenis.resize());
    }
  }

  /**
   * Initialize Landing Page Animations (Framer Motion style)
   */
  function initLandingAnimations() {
    if (typeof Motion === 'undefined') return;
    const { animate, inView } = Motion;

    // Check if on landing page
    const isLanding = document.querySelector('.hero') !== null;
    if (!isLanding) return;

    // --- A. HERO SECTION INTRO (Staggered Entry) ---
    // 1. Hero Badge
    animate(".reveal-badge", { opacity: 1, y: 0 }, { 
      duration: 0.6, 
      easing: [0.16, 1, 0.3, 1] 
    });

    // 2. Hero Title & Subtitle (staggered)
    animate(".reveal-hero-text", { opacity: 1, y: 0 }, { 
      delay: 0.15,
      duration: 0.7, 
      easing: [0.16, 1, 0.3, 1] 
    });

    // 3. Hero Actions (Buttons)
    animate(".hero-actions", { opacity: [0, 1], y: [15, 0] }, { 
      delay: 0.3, 
      duration: 0.6, 
      easing: [0.16, 1, 0.3, 1] 
    });

    // 4. Hero Mockup
    animate(".reveal-mockup", { opacity: 1, scale: 1, y: 0, rotate: 0 }, { 
      delay: 0.45, 
      duration: 0.9, 
      easing: [0.16, 1, 0.3, 1] 
    });

    // --- B. SCROLL REVEAL ANIMATIONS (Trigger when scrolled into view) ---
    inView(".reveal-on-scroll", ({ target }) => {
      animate(target, { opacity: 1, y: 0 }, { 
        duration: 0.7, 
        easing: [0.16, 1, 0.3, 1] 
      });
      // Return a cleanup function so it only runs once
      return () => {};
    });

    // --- C. METRIC COUNTER ANIMATIONS ---
    inView(".metric-card h3", ({ target }) => {
      const originalText = target.textContent.trim();
      const match = originalText.match(/^([\d.,]+)(.*)$/);
      if (!match) return;

      const rawNumStr = match[1].replace(/,/g, '');
      const finalVal = parseFloat(rawNumStr);
      if (isNaN(finalVal)) return;

      const suffix = match[2] || '';
      const duration = 1600; // ms
      let startTime = null;

      function countUp(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3.5); // smooth exponential ease-out
        const currentVal = Math.round(easeProgress * finalVal);

        target.textContent = currentVal.toLocaleString() + suffix;

        if (progress < 1) {
          requestAnimationFrame(countUp);
        } else {
          target.textContent = originalText; // Ensure we finish on the exact text
        }
      }

      requestAnimationFrame(countUp);
      return () => {};
    });

    // --- D. SMOOTH FAQ ACCORDIONS ---
    setupSmoothFaqs();
  }

  /**
   * Sets up smooth height and fade animations for the FAQ accordions
   */
  function setupSmoothFaqs() {
    const faqAnswers = document.querySelectorAll('.faq-answer');
    faqAnswers.forEach(answer => {
      answer.style.display = 'block'; // Always block, control height dynamically
      answer.style.maxHeight = '0px';
      answer.style.overflow = 'hidden';
      answer.style.paddingTop = '0px';
      answer.style.paddingBottom = '0px';
      answer.style.opacity = '0';
      answer.style.borderTop = '1px solid transparent';
      answer.style.transition = 'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, padding 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease';
    });

    document.querySelectorAll('.faq-question').forEach(q => {
      // Create new event handler to support slide animation
      q.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation(); // Override the standard instant display toggler

        const item = q.parentElement;
        const answer = item.querySelector('.faq-answer');
        const isActive = item.classList.contains('active');

        // Close all other FAQ items
        document.querySelectorAll('.faq-item').forEach(el => {
          el.classList.remove('active');
          const ans = el.querySelector('.faq-answer');
          if (ans) {
            ans.style.maxHeight = '0px';
            ans.style.opacity = '0';
            ans.style.paddingTop = '0px';
            ans.style.paddingBottom = '0px';
            ans.style.borderColor = 'transparent';
          }
        });

        // Open this item if it wasn't already active
        if (!isActive) {
          item.classList.add('active');
          answer.style.paddingTop = '14px';
          answer.style.paddingBottom = '20px';
          answer.style.borderColor = 'rgba(255, 255, 255, 0.06)';
          answer.style.maxHeight = (answer.scrollHeight + 34) + 'px'; // add padding offset
          answer.style.opacity = '1';
        }
      });
    });
  }

  /**
   * Initialize Dashboard Entry Transitions
   */
  function initDashboardTransitions() {
    if (!document.body.classList.contains('dashboard-body')) return;

    // Wrap the window.navigateTo function if it is defined
    const originalNavigateTo = window.navigateTo;
    if (originalNavigateTo) {
      window.navigateTo = function(pageName, navItem) {
        // Run original navigateTo to change visibility
        originalNavigateTo(pageName, navItem);

        // Animate the active page entry
        const targetPage = document.getElementById('page-' + pageName);
        if (targetPage && typeof Motion !== 'undefined') {
          const { animate } = Motion;
          // Set initial styles for entry transition
          targetPage.style.opacity = '0';
          targetPage.style.transform = 'translateY(12px)';

          // Run entry animation
          animate(targetPage, { opacity: 1, y: 0 }, { 
            duration: 0.35, 
            easing: [0.16, 1, 0.3, 1] 
          });
        }
      };
    }
  }
})();
