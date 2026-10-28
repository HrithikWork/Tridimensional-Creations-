/**
 * ============================================================================
 * TRIDIMENSIONAL CREATION PVT LTD — GLOBAL JAVASCRIPT (main.js)
 * Architectural & Precision CNC / 3D Fabrication Studio | Guwahati, Assam
 * Supabase Backend & Storage Buckets Integration
 * ============================================================================
 */

(function () {
  'use strict';

  // Studio Production Hotline / WhatsApp Destination
  const STUDIO_WHATSAPP_NUMBER = '918011958307';
  const STUDIO_EMAIL = 'tricreations.official@gmail.com';

  /**
   * Helper to get initialized Supabase client
   */
  async function getSupabase() {
    if (window.supabaseClient) return window.supabaseClient;
    try {
      const mod = await import('/supabaseClient.js');
      return mod.supabase;
    } catch {
      return null;
    }
  }

  /**
   * Dedicated file uploader for customer uploads
   */
  async function uploadCustomerFile(file) {
    if (!file) return null;
    try {
      if (window.uploadFileToBucket) {
        return await window.uploadFileToBucket('customer-uploads', file);
      }
      const mod = await import('/supabaseClient.js');
      return await mod.uploadFileToBucket('customer-uploads', file);
    } catch (err) {
      console.warn('File upload fallback:', err);
      return null;
    }
  }

  /**
   * 01. SMOOTH SCROLLING FOR ANCHOR LINKS
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
   */
  function generateWhatsAppLink(productName, requiredWidth, requiredHeight, requiredThickness, notes, fileUrl = '') {
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
      `${cleanNotes}`
    ];

    if (fileUrl) {
      messageLines.push(``);
      messageLines.push(`*Customer Reference / STL File:*`);
      messageLines.push(`${fileUrl}`);
    }

    messageLines.push(``);
    messageLines.push(`— Sent from tridimensional.in digital catalog`);

    const rawMessage = messageLines.join('\n');
    return `https://wa.me/${STUDIO_WHATSAPP_NUMBER}?text=${encodeURIComponent(rawMessage)}`;
  }

  /**
   * 03. STICKY HEADER SCROLL DETECTION
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
   * Queries Supabase `catalog_capabilities` table with automatic fallback to /products.json.
   */
  async function loadCatalog() {
    const catalogContainer = document.getElementById('catalog-grid-container');
    if (!catalogContainer) return;

    try {
      let products = [];
      const supabase = await getSupabase();

      if (supabase) {
        const { data, error } = await supabase
          .from('catalog_capabilities')
          .select('*')
          .order('slug', { ascending: true });

        if (!error && data && data.length > 0) {
          products = data.map((item) => ({
            id: item.slug || item.id,
            category: item.category,
            title: item.title,
            image_placeholder: item.image_url || '/Images/cnc-leaf-petals-door-grill.svg'
          }));
        }
      }

      // Fallback to /products.json if remote database is empty or offline
      if (products.length === 0) {
        const response = await fetch('/products.json');
        if (response.ok) {
          products = await response.json();
        }
      }

      let currentFilter = 'all';

      const renderCards = (filterCategory) => {
        catalogContainer.innerHTML = '';

        const filtered = filterCategory === 'all' 
          ? products 
          : products.filter((p) => p.category === filterCategory);

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
                src="${product.image_placeholder || '/Images/cnc-leaf-petals-door-grill.svg'}" 
                alt="${product.title}" 
                class="product-card-image"
                loading="lazy"
                onerror="this.onerror=null; if(this.src.includes('cnc-leaf')) this.src='/Images/cnc-leaf-petals-door-grill.svg';"
              />
            </div>
            <span class="product-card-title">${product.title}</span>
          `;

          catalogContainer.appendChild(cardAnchor);
        });
      };

      // Initial render
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
      console.error('Error loading catalog:', err);
    }
  }

  /**
   * 06. PRODUCT DETAIL PARSING & FORM HANDLING (For product.html)
   * Queries Supabase `catalog_capabilities` and connects `#custom-quote-form` to `customer_inquiries` table & `customer-uploads` bucket.
   */
  async function loadProductDetail() {
    const detailContainer = document.getElementById('product-detail-view');
    if (!detailContainer) return;

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id') || 'cnc-jali-cutting-panels';

    try {
      let product = null;
      const supabase = await getSupabase();

      if (supabase) {
        const { data, error } = await supabase
          .from('catalog_capabilities')
          .select('*')
          .or(`slug.eq.${productId},id.eq.${productId}`)
          .single();

        if (!error && data) {
          product = {
            id: data.slug || data.id,
            category: data.category,
            title: data.title,
            description: data.description,
            design_scope: Array.isArray(data.design_scope) ? data.design_scope : [],
            where_to_use: Array.isArray(data.where_to_use) ? data.where_to_use : [],
            tech_specs: data.tech_specs || {},
            customization: data.customization,
            image_placeholder: data.image_url
          };
        }
      }

      // Fallback to /products.json
      if (!product) {
        const response = await fetch('/products.json');
        if (response.ok) {
          const products = await response.json();
          product = products.find((p) => p.id === productId) || products[0];
        }
      }

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
        imgElem.src = product.image_placeholder || '/Images/cnc-leaf-petals-door-grill.svg';
        imgElem.alt = product.title;
      }
      if (methodBadge) {
        methodBadge.textContent = product.manufacturing_method || product.category;
      }

      // Populate Design Scope List
      const scopeList = document.getElementById('product-scope-list');
      if (scopeList && Array.isArray(product.design_scope)) {
        scopeList.innerHTML = product.design_scope.map((item) => `<li>${item}</li>`).join('');
      }

      // Populate Where To Use List
      const usageList = document.getElementById('product-usage-list');
      if (usageList && Array.isArray(product.where_to_use)) {
        usageList.innerHTML = product.where_to_use.map((item) => `<li>${item}</li>`).join('');
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

      // Bind Custom Specification Quote Form with Storage Upload & Database Insertion
      const quoteForm = document.getElementById('custom-quote-form');
      if (quoteForm) {
        quoteForm.addEventListener('submit', async function (e) {
          e.preventDefault();

          const submitBtn = quoteForm.querySelector('button[type="submit"]');
          const originalText = submitBtn ? submitBtn.textContent : 'Request Quote';
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing & Uploading...';
          }

          const email = document.getElementById('quote-email')?.value.trim() || '';
          const phone = document.getElementById('quote-phone')?.value.trim() || '';
          const widthVal = document.getElementById('quote-width')?.value.trim() || '';
          const heightVal = document.getElementById('quote-height')?.value.trim() || '';
          const thkVal = document.getElementById('quote-thickness')?.value.trim() || '';
          const notesVal = document.getElementById('quote-notes')?.value.trim() || '';

          let uploadedFileUrl = '';
          let uploadedFileName = '';

          // 1. Upload file to dedicated 'customer-uploads' bucket if attached
          if (fileInput && fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            uploadedFileName = file.name;
            const uploadResult = await uploadCustomerFile(file);
            if (uploadResult?.publicUrl) {
              uploadedFileUrl = uploadResult.publicUrl;
            }
          }

          // 2. Insert into customer_inquiries table in Supabase
          const inquiryPayload = {
            source: 'Product Quote',
            full_name: phone || email || 'Client',
            email: email,
            phone: phone,
            product_title: product.title,
            service_type: product.category,
            width_x: widthVal,
            height_y: heightVal,
            thickness_z: thkVal,
            message: notesVal,
            reference_file_url: uploadedFileUrl || null,
            reference_file_name: uploadedFileName || null
          };

          try {
            const supabase = await getSupabase();
            if (supabase) {
              await supabase.from('customer_inquiries').insert([inquiryPayload]);
            }
            // Dual-dispatch to backend API endpoint
            await fetch('/api/inquiries', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(inquiryPayload)
            });
          } catch (dbErr) {
            console.warn('Inquiry record logged:', dbErr);
          }

          // 3. Generate WhatsApp link with live download link included
          const combinedNotes = `Contact Firm: ${phone} | ${email}\nNotes: ${notesVal}`;
          const waUrl = generateWhatsAppLink(product.title, widthVal, heightVal, thkVal, combinedNotes, uploadedFileUrl);

          // Open WhatsApp
          window.open(waUrl, '_blank');

          // Confirmation notice
          const feedback = document.getElementById('quote-feedback');
          if (feedback) {
            feedback.style.display = 'block';
            feedback.style.backgroundColor = '#F0F9F2';
            feedback.style.color = '#1E6B37';
            feedback.style.border = '1px solid #D4EDDA';
            feedback.style.padding = '1rem';
            feedback.style.borderRadius = '4px';
            feedback.innerHTML = `
              <strong>Project specifications captured & stored!</strong><br />
              ${uploadedFileUrl ? `Reference file uploaded to studio cloud.<br />` : ''}
              Routing to Tridimensional Creation's Guwahati studio desk on WhatsApp. Our 3D sculpting artists will review your specifications within 24 hours.
            `;
          }

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
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

    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.textContent : 'Submit';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading & Logging...';
      }

      const name = document.getElementById('contact-name')?.value || 'Client';
      const email = document.getElementById('contact-email')?.value || '';
      const phone = document.getElementById('contact-phone')?.value || '';
      const inquiryType = document.getElementById('contact-type')?.value || 'Project Inquiry';
      const apptDate = document.getElementById('contact-date')?.value || '';
      const brief = document.getElementById('contact-brief')?.value || '';

      let uploadedFileUrl = '';
      let uploadedFileName = '';

      // Upload file to dedicated 'customer-uploads' bucket
      if (contactFileInput && contactFileInput.files && contactFileInput.files[0]) {
        const file = contactFileInput.files[0];
        uploadedFileName = file.name;
        const uploadResult = await uploadCustomerFile(file);
        if (uploadResult?.publicUrl) {
          uploadedFileUrl = uploadResult.publicUrl;
        }
      }

      const inquiryPayload = {
        source: 'Studio Appointment',
        full_name: name,
        email: email,
        phone: phone,
        service_type: inquiryType,
        appointment_date: apptDate,
        message: brief,
        reference_file_url: uploadedFileUrl || null,
        reference_file_name: uploadedFileName || null
      };

      try {
        const supabase = await getSupabase();
        if (supabase) {
          await supabase.from('customer_inquiries').insert([inquiryPayload]);
        }
        await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inquiryPayload)
        });
      } catch (err) {
        console.warn('Contact logging note:', err);
      }

      // Open WhatsApp routing with file link embedded
      const fullMessage = [
        `*TRIDIMENSIONAL CREATION — STUDIO CONSULTATION INQUIRY*`,
        ``,
        `*Client:* ${name}`,
        `*Contact:* ${phone} | ${email}`,
        `*Nature of Inquiry:* ${inquiryType}`,
        `*Preferred Consultation Date:* ${apptDate || 'Flexible'}`,
        ``,
        `*Project Details:*`,
        `${brief}`,
        uploadedFileUrl ? `\n*Reference File Attached:*\n${uploadedFileUrl}` : ``,
        ``,
        `— Sent from tridimensional.in contact desk`
      ].filter(Boolean).join('\n');

      const waUrl = `https://wa.me/${STUDIO_WHATSAPP_NUMBER}?text=${encodeURIComponent(fullMessage)}`;
      window.open(waUrl, '_blank');

      const feedback = document.getElementById('contact-feedback');
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.backgroundColor = '#f4fbf6';
        feedback.style.color = '#1b5e20';
        feedback.style.border = '1px solid #c8e6c9';
        feedback.style.padding = '1rem';
        feedback.style.marginTop = '1rem';
        feedback.innerHTML = `
          <strong>Inquiry Received!</strong><br />
          Thank you, ${name}. Your project request has been logged in our studio database. Our engineering and digital sculpting team will review your specifications within 24 hours.
        `;
      }

      contactForm.reset();
      if (contactFileLabel) {
        contactFileLabel.innerHTML = `<span>Attach Reference Photo, Sketch or 3D File (STL/OBJ/CAD)</span>`;
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }

  /**
   * 08. HOME PAGE ASSETS INTEGRATION (For index.html)
   * Fetches `page_assets` where `page_name = 'home'` and `section_name = 'home-marquee'`
   */
  async function initHomePageAssets() {
    const marqueeTrack = document.querySelector('.marquee-track');
    if (!marqueeTrack) return;

    try {
      const supabase = await getSupabase();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('page_assets')
        .select('*')
        .eq('page_name', 'home')
        .eq('section_name', 'home-marquee')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) return;

      // Build Set A & Set B
      marqueeTrack.innerHTML = '';
      const setA = data.map((item) => `
        <div class="marquee-slide">
          <img src="${item.image_url}" alt="${item.title}" loading="lazy" />
        </div>
      `).join('');

      const setB = data.map((item) => `
        <div class="marquee-slide" aria-hidden="true">
          <img src="${item.image_url}" alt="${item.title}" loading="lazy" />
        </div>
      `).join('');

      marqueeTrack.innerHTML = setA + setB;
      console.log(`Populated ${data.length} custom home marquee slides from Supabase page_assets.`);
    } catch (err) {
      console.warn('Home page assets note:', err);
    }
  }

  /**
   * 09. ABOUT PAGE ASSETS INTEGRATION (For about.html)
   * Fetches `page_assets` where `page_name = 'about'` and `section_name = 'foundation-story'`
   */
  async function initAboutPageAssets() {
    const foundationImg = document.querySelector('.foundation-img');
    if (!foundationImg) return;

    try {
      const supabase = await getSupabase();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('page_assets')
        .select('*')
        .eq('page_name', 'about')
        .eq('section_name', 'foundation-story')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data?.image_url) {
        foundationImg.src = data.image_url;
        foundationImg.alt = data.title || 'Tridimensional Creation Studio';
        console.log('Updated foundation-story image from Supabase page_assets.');
      }
    } catch (err) {
      console.warn('About page asset note:', err);
    }
  }

  // Self-Initialization on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    initSmoothScrolling();
    initStickyHeader();
    initMobileNav();
    loadCatalog();
    loadProductDetail();
    initContactForm();
    initHomePageAssets();
    initAboutPageAssets();
  });

  // Export functions to window for global or external script access if needed
  window.Tridimensional = {
    generateWhatsAppLink,
    STUDIO_WHATSAPP_NUMBER,
    STUDIO_EMAIL
  };
})();
