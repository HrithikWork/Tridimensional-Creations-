/**
 * ============================================================================
 * TRIDIMENSIONAL CREATION PVT LTD — GLOBAL JAVASCRIPT (main.js)
 * Architectural & Precision CNC / 3D Fabrication Studio | Guwahati, Assam
 * ============================================================================
 */

(function () {
  'use strict';

  // Studio Production Hotline / WhatsApp Destination
  const STUDIO_WHATSAPP_NUMBER = '918011958307';
  const STUDIO_EMAIL = 'tricreations.official@gmail.com';

  /**
   * 01. SMOOTH SCROLLING FOR ANCHOR LINKS
   * Intercepts standard in-page hash anchors to provide a smooth architectural glide,
   * accounting for the sticky header offset.
   */
  function initSmoothScrolling() {
    const internalAnchors = document.querySelectorAll('a[href^="#"]:not([href="#"])');

    internalAnchors.forEach((anchor) => {
      anchor.addEventListener('click', function (event) {
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          event.preventDefault();
          const header = document.querySelector('.site-header');
          const headerHeight = header ? header.offsetHeight : 80;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - (headerHeight + 20);

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Close mobile navigation drawer if open
          const navLinks = document.querySelector('.nav-links');
          if (navLinks && navLinks.classList.contains('is-open')) {
            navLinks.classList.remove('is-open');
          }
        }
      });
    });
  }

  /**
   * 02. WHATSAPP LINK GENERATOR
   * Formats a clean, professional, URL-encoded string containing custom architectural dimensions
   * and routes the inquiry directly to the studio engineering desk.
   *
   * @param {string} productName - Title or design scope of the requested product
   * @param {string|number} requiredWidth - Width / X-Axis dimension
   * @param {string|number} requiredHeight - Height / Y-Axis dimension
   * @param {string|number} requiredThickness - Thickness / Depth dimension
   * @param {string} notes - Material preferences, architectural notes, or site references
   * @returns {string} Fully encoded WhatsApp URL
   */
  function generateWhatsAppLink(productName, requiredWidth, requiredHeight, requiredThickness, notes) {
    const cleanProduct = (productName || 'Bespoke Fabrication Inquiry').trim();
    const widthStr = requiredWidth ? String(requiredWidth).trim() : 'As per site schedule';
    const heightStr = requiredHeight ? String(requiredHeight).trim() : 'As per site schedule';
    const thkStr = requiredThickness ? String(requiredThickness).trim() : 'Standard substrate';
    const cleanNotes = (notes || 'Please verify machine toolpath feasibility and lead time.').trim();

    const messageLines = [
      `*TRIDIMENSIONAL CREATION — CUSTOM FABRICATION INQUIRY*`,
      ``,
      `*Product / Element:* ${cleanProduct}`,
      `*Specified Dimensions:*`,
      `  • Width (X-Axis): ${widthStr}`,
      `  • Height (Y-Axis): ${heightStr}`,
      `  • Thickness / Relief Depth (Z-Axis): ${thkStr}`,
      ``,
      `*Project Specifications & Notes:*`,
      `${cleanNotes}`,
      ``,
      `— Sent from tridimensional.in digital catalog`
    ];

    const rawMessage = messageLines.join('\n');
    const encodedMessage = encodeURIComponent(rawMessage);

    return `https://wa.me/${STUDIO_WHATSAPP_NUMBER}?text=${encodedMessage}`;
  }

  /**
   * 03. STICKY HEADER SCROLL DETECTION
   * Adds an elevation shadow when scrolled beyond the initial masthead.
   */
  function initStickyHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const handleScroll = () => {
      if (window.scrollY > 24) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  /**
   * 04. RESPONSIVE MOBILE NAVIGATION TOGGLE
   */
  function initMobileNav() {
    const toggleBtn = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (toggleBtn && navLinks) {
      toggleBtn.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('is-open');
        toggleBtn.setAttribute('aria-expanded', String(isOpen));
      });
    }
  }

  /**
   * 05. CATALOG DYNAMIC RENDERING & FILTERING (For catalog.html)
   * Fetches products.json and renders a minimalist card for each of the 18 products.
   * Card ONLY displays image placeholder and 1-line title.
   * Wrapped in anchor linking to product.html?id=[id].
   */
  async function loadCatalog() {
    const catalogContainer = document.getElementById('catalog-grid-container');
    if (!catalogContainer) return;

    try {
      const response = await fetch('/products.json');
      if (!response.ok) {
        throw new Error(`Failed to load catalog data (Status: ${response.status})`);
      }
      const products = await response.json();

      let currentFilter = 'all';

      // Function to render cards
      const renderCards = (filterCategory) => {
        catalogContainer.innerHTML = '';

        const filtered = filterCategory === 'all' 
          ? products 
          : products.filter((p) => p.category === filterCategory);

        // Update count label if present
        const countLabel = document.getElementById('catalog-count-label');
        if (countLabel) {
          countLabel.textContent = `Showing ${filtered.length} of ${products.length} Fabrication Capabilities`;
        }

        if (filtered.length === 0) {
          catalogContainer.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; border: 1px solid var(--color-stone-border);">
              <p>No capabilities found under the selected category.</p>
            </div>
          `;
          return;
        }

        filtered.forEach((product) => {
          const cardAnchor = document.createElement('a');
          cardAnchor.href = `product.html?id=${encodeURIComponent(product.id)}`;
          cardAnchor.className = 'product-card';
          cardAnchor.setAttribute('aria-label', product.title);

          cardAnchor.innerHTML = `
            <div class="product-card-image-wrap">
              <img 
                src="${product.image_placeholder}" 
                alt="${product.title}" 
                class="product-card-image"
                loading="lazy"
              />
            </div>
            <span class="product-card-title">${product.title}</span>
          `;

          catalogContainer.appendChild(cardAnchor);
        });
      };

      // Initial render: all 18 products
      renderCards('all');

      // Bind category filter tabs
      const filterButtons = document.querySelectorAll('.catalog-filter');
      filterButtons.forEach((btn) => {
        btn.addEventListener('click', function () {
          filterButtons.forEach((b) => b.classList.remove('active'));
          this.classList.add('active');

          currentFilter = this.getAttribute('data-filter') || 'all';
          renderCards(currentFilter);
        });
      });

    } catch (err) {
      console.error('Error loading architectural catalog:', err);
      catalogContainer.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2.5rem; border: 1px solid var(--color-stone-border); text-align: center; background-color: #FFFFFF;">
          <p style="margin-bottom: 0.5rem; color: var(--color-charcoal); font-weight: 500;">Unable to load capability catalog.</p>
          <p style="font-size: var(--text-xs); color: var(--color-charcoal-light);">Please check your network or connect with our Guwahati engineering desk at +91 80119 58307.</p>
        </div>
      `;
    }
  }

  /**
   * 06. PRODUCT DETAIL PARSING & FORM HANDLING (For product.html)
   * Reads the `?id=` query parameter, populates technical specs, and binds the custom quote form.
   */
  async function loadProductDetail() {
    const detailContainer = document.getElementById('product-detail-view');
    if (!detailContainer) return;

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id') || 'cnc-jali-cutting-panels';

    try {
      const response = await fetch('/products.json');
      if (!response.ok) {
        throw new Error(`Failed to load product data (Status: ${response.status})`);
      }
      const products = await response.json();
      const product = products.find((p) => p.id === productId) || products[0];

      if (!product) return;

      // Update Document Title & Breadcrumbs
      document.title = `${product.title} | Tridimensional Creation`;
      const breadcrumbCat = document.getElementById('breadcrumb-category');
      if (breadcrumbCat) breadcrumbCat.textContent = product.title;

      const categoryEyebrow = document.getElementById('product-category-eyebrow');
      if (categoryEyebrow) categoryEyebrow.textContent = `${product.category} • Precision Production`;

      // Populate Visual & Title
      const titleElem = document.getElementById('product-title');
      const descElem = document.getElementById('product-description');
      const imgElem = document.getElementById('product-main-image');
      const methodBadge = document.getElementById('product-method-badge');

      if (titleElem) titleElem.textContent = product.title;
      if (descElem) descElem.textContent = product.description;
      if (imgElem) {
        imgElem.src = product.image_placeholder;
        imgElem.alt = product.title;
      }
      if (methodBadge) {
        methodBadge.textContent = product.manufacturing_method || product.category;
      }

      // Populate Design Scope List
      const scopeList = document.getElementById('product-scope-list');
      if (scopeList && Array.isArray(product.design_scope)) {
        scopeList.innerHTML = product.design_scope
          .map((item) => `<li>${item}</li>`)
          .join('');
      }

      // Populate Where To Use List
      const usageList = document.getElementById('product-usage-list');
      if (usageList && Array.isArray(product.where_to_use)) {
        usageList.innerHTML = product.where_to_use
          .map((item) => `<li>${item}</li>`)
          .join('');
      }

      // Populate Technical Specs
      const specsElem = document.getElementById('product-specs-content');
      if (specsElem && product.tech_specs) {
        const thickness = product.tech_specs.thickness || 'Custom / Per site schedule';
        const materials = product.tech_specs.materials || 'HDHMR, WPC, Wood, Acrylic, Resin';
        const finishes = product.tech_specs.finishes || 'Raw CNC cut, Sanded primer, or Factory PU spray';

        specsElem.innerHTML = `
          <p><strong style="color: var(--color-charcoal);">Thickness / Relief Depth:</strong> ${thickness}</p>
          <p><strong style="color: var(--color-charcoal);">Substrates / Materials:</strong> ${materials}</p>
          <p><strong style="color: var(--color-charcoal);">Available Finishes:</strong> ${finishes}</p>
        `;
      }

      // Populate Customization Notes
      const customElem = document.getElementById('product-customization-content');
      if (customElem && product.customization) {
        customElem.textContent = product.customization;
      }

      // File upload visual feedback
      const fileInput = document.getElementById('quote-file');
      const fileLabel = document.getElementById('quote-file-label');
      if (fileInput && fileLabel) {
        fileInput.addEventListener('change', function () {
          if (this.files && this.files.length > 0) {
            fileLabel.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Selected: ${this.files[0].name}</span>
            `;
          } else {
            fileLabel.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>Attach Reference Photo or CAD File</span>
            `;
          }
        });
      }

      // Bind Custom Specification Quote Form
      const quoteForm = document.getElementById('custom-quote-form');
      if (quoteForm) {
        quoteForm.addEventListener('submit', function (e) {
          e.preventDefault();

          const email = document.getElementById('quote-email')?.value.trim() || '';
          const phone = document.getElementById('quote-phone')?.value.trim() || '';
          const widthVal = document.getElementById('quote-width')?.value.trim() || '';
          const heightVal = document.getElementById('quote-height')?.value.trim() || '';
          const thkVal = document.getElementById('quote-thickness')?.value.trim() || '';
          const notesVal = document.getElementById('quote-notes')?.value.trim() || '';
          const fileNote = fileInput && fileInput.files && fileInput.files[0] 
            ? `\n[Reference Attached: ${fileInput.files[0].name}]` 
            : '';

          const combinedNotes = `Contact Firm: ${phone} | ${email}\nNotes: ${notesVal}${fileNote}`;
          const waUrl = generateWhatsAppLink(product.title, widthVal, heightVal, thkVal, combinedNotes);

          // Trigger WhatsApp routing
          window.open(waUrl, '_blank');

          // Confirmation notice
          const feedback = document.getElementById('quote-feedback');
          if (feedback) {
            feedback.style.display = 'block';
            feedback.innerHTML = `
              <strong>Project specifications captured.</strong><br />
              Routing to Tridimensional Creation's Guwahati studio desk on WhatsApp. Our 3D sculpting artists will review your reference photo or model and respond with a digital preview within 24 hours.
            `;
          }
        });
      }
    } catch (err) {
      console.error('Error loading product details:', err);
    }
  }

  /**
   * 07. CONTACT & STUDIO APPOINTMENT FORM (For contact.html)
   */
  function initContactForm() {
    const contactForm = document.getElementById('studio-inquiry-form');
    if (!contactForm) return;

    const contactFileInput = document.getElementById('contact-file');
    const contactFileLabel = document.getElementById('contact-file-label');
    if (contactFileInput && contactFileLabel) {
      contactFileInput.addEventListener('change', function () {
        if (this.files && this.files.length > 0) {
          contactFileLabel.innerHTML = `<span>Selected: ${this.files[0].name}</span>`;
        }
      });
    }

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = document.getElementById('contact-name')?.value || 'Client';
      const email = document.getElementById('contact-email')?.value || '';
      const phone = document.getElementById('contact-phone')?.value || '';
      const inquiryType = document.getElementById('contact-type')?.value || 'Project Inquiry';
      const apptDate = document.getElementById('contact-date')?.value || 'Flexible';
      const brief = document.getElementById('contact-brief')?.value || '';
      const fileNote = contactFileInput && contactFileInput.files && contactFileInput.files[0] 
        ? `\n[Reference Attached: ${contactFileInput.files[0].name}]` 
        : '';

      const fullMessage = [
        `*TRIDIMENSIONAL CREATION — PROJECT INQUIRY*`,
        ``,
        `*Client:* ${name}`,
        `*Contact:* ${phone} | ${email}`,
        `*Nature of Inquiry:* ${inquiryType}`,
        `*Preferred Consultation Date:* ${apptDate}`,
        ``,
        `*Project Details:*`,
        `${brief}${fileNote}`,
        ``,
        `— Sent from tridimensional.in contact desk`
      ].join('\n');

      const waUrl = `https://wa.me/${STUDIO_WHATSAPP_NUMBER}?text=${encodeURIComponent(fullMessage)}`;
      window.open(waUrl, '_blank');

      const feedback = document.getElementById('contact-feedback');
      if (feedback) {
        feedback.style.display = 'block';
        feedback.textContent = 'Thank you. Your project inquiry has been forwarded to our 3D sculpting and fabrication studio.';
      }
    });
  }

  // Self-Initialization on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    initSmoothScrolling();
    initStickyHeader();
    initMobileNav();
    loadCatalog();
    loadProductDetail();
    initContactForm();
  });

  // Export functions to window for global or external script access if needed
  window.Tridimensional = {
    generateWhatsAppLink,
    STUDIO_WHATSAPP_NUMBER,
    STUDIO_EMAIL
  };
})();
