/**
 * Tridimensional Creation Pvt Ltd — Master Admin Desk (admin.js)
 * Full-featured production CRUD management connected to Supabase and dedicated Storage Buckets.
 */

import { supabase, BUCKETS, uploadFileToBucket } from './supabaseClient.js';

// Studio production WhatsApp phone number
const STUDIO_PHONE = '918011958307';

// In-memory state caches
let state = {
  inquiries: [],
  portfolio: [],
  catalog: [],
  blogs: [],
  assets: [],
  activeTab: 'tab-inquiries',
  uploadedFiles: {
    portfolio: null,
    catalog: null,
    blog: null,
    asset: null
  }
};

/**
 * Toast Notification System
 */
function showToast(message, isError = false) {
  const toast = document.getElementById('admin-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = 'block';
  toast.style.backgroundColor = isError ? '#900C22' : '#1E6B37';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3500);
}

/**
 * Date Formatter
 */
function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return isoString;
  }
}

// ==============================================================================
// 1. AUTHENTICATION CONTROLLER
// ==============================================================================
async function initAuth() {
  const authSection = document.getElementById('auth-gate-section');
  const dashboard = document.getElementById('admin-dashboard-wrapper');
  const userNav = document.getElementById('admin-user-nav');
  const userEmailEl = document.getElementById('admin-user-email');
  const loginForm = document.getElementById('admin-login-form');
  const errorNotice = document.getElementById('auth-error-notice');
  const bypassBtn = document.getElementById('admin-bypass-btn');
  const logoutBtn = document.getElementById('admin-logout-btn');

  function renderLoggedIn(email) {
    authSection.style.display = 'none';
    dashboard.style.display = 'block';
    userNav.style.display = 'flex';
    userEmailEl.textContent = email || 'admin@tridimensional.in';
    loadAllDashboardData();
  }

  function renderLoggedOut() {
    authSection.style.display = 'flex';
    dashboard.style.display = 'none';
    userNav.style.display = 'none';
  }

  // Check persistent session or admin bypass flag
  const isBypassed = sessionStorage.getItem('tri_admin_session') === 'true';
  if (isBypassed) {
    renderLoggedIn('admin@tridimensional.in (Studio Session)');
  } else {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        renderLoggedIn(session.user.email);
      } else {
        renderLoggedOut();
      }
    } catch {
      renderLoggedOut();
    }
  }

  // Listen for Supabase auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      sessionStorage.removeItem('tri_admin_session');
      renderLoggedIn(session.user.email);
    } else if (!sessionStorage.getItem('tri_admin_session')) {
      renderLoggedOut();
    }
  });

  // Handle Login Form Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit-btn');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Authenticating...';
    errorNotice.style.display = 'none';

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      renderLoggedIn(data.user.email);
      showToast('Successfully authenticated to studio desk.');
    } catch (err) {
      errorNotice.style.display = 'block';
      errorNotice.innerHTML = `
        <strong>Sign-in Notice:</strong> ${err.message}<br />
        <span style="font-size: 0.7rem; color: #555;">Tip: If you haven't created a Supabase Auth user yet, click "Enter with Studio Desk Session" below to proceed.</span>
      `;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In to Studio Desk';
    }
  });

  // Developer / Studio Session Bypass
  bypassBtn.addEventListener('click', () => {
    sessionStorage.setItem('tri_admin_session', 'true');
    renderLoggedIn('admin@tridimensional.in (Studio Session)');
    showToast('Entered with administrative studio privileges.');
  });

  // Logout Handler
  logoutBtn.addEventListener('click', async () => {
    sessionStorage.removeItem('tri_admin_session');
    try {
      await supabase.auth.signOut();
    } catch {}
    renderLoggedOut();
    showToast('Signed out of studio desk.');
  });
}

// ==============================================================================
// 2. MASTER TABS NAVIGATION CONTROLLER
// ==============================================================================
function initTabs() {
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabPanes = document.querySelectorAll('.admin-tab-pane');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabBtns.forEach((b) => b.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
        state.activeTab = targetId;
      }
    });
  });
}

// ==============================================================================
// 3. DRAG-AND-DROP FILE UPLOADER CONTROLLER
// ==============================================================================
function setupDropZone(dropZoneId, fileInputId, previewWrapId, previewImgId, previewNameId, stateKey) {
  const dropZone = document.getElementById(dropZoneId);
  const fileInput = document.getElementById(fileInputId);
  const previewWrap = document.getElementById(previewWrapId);
  const previewImg = document.getElementById(previewImgId);
  const previewName = document.getElementById(previewNameId);

  if (!dropZone || !fileInput) return;

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  ['dragleave', 'dragend'].forEach((type) => {
    dropZone.addEventListener(type, () => dropZone.classList.remove('dragover'));
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFileSelected(fileInput.files[0]);
    }
  });

  function handleFileSelected(file) {
    state.uploadedFiles[stateKey] = file;
    if (previewWrap && previewImg && previewName) {
      previewWrap.style.display = 'flex';
      previewName.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      const objectUrl = URL.createObjectURL(file);
      previewImg.src = objectUrl;
    }
  }
}

function clearDropZonePreview(previewWrapId, previewImgId, previewNameId, stateKey) {
  state.uploadedFiles[stateKey] = null;
  const previewWrap = document.getElementById(previewWrapId);
  const previewImg = document.getElementById(previewImgId);
  const previewName = document.getElementById(previewNameId);
  if (previewWrap) previewWrap.style.display = 'none';
  if (previewImg) previewImg.src = '';
  if (previewName) previewName.textContent = '';
}

// ==============================================================================
// 4. TAB 1: CUSTOMER INQUIRIES & APPOINTMENTS CONTROLLER
// ==============================================================================
async function loadInquiries() {
  const tbody = document.getElementById('inquiries-tbody');
  const countBadge = document.getElementById('count-inquiries');

  try {
    // Try primary table customer_inquiries
    let { data, error } = await supabase
      .from('customer_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    // Fallback to quotes_and_appointments if customer_inquiries is not yet created
    if (error || !data) {
      const fallback = await supabase
        .from('quotes_and_appointments')
        .select('*')
        .order('created_at', { ascending: false });
      data = fallback.data || [];
    }

    state.inquiries = data || [];
    countBadge.textContent = state.inquiries.length;
    renderInquiriesTable(state.inquiries);
  } catch (err) {
    console.error('Error fetching customer inquiries:', err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #C0392B;">Error loading inquiries: ${err.message}</td></tr>`;
  }
}

function renderInquiriesTable(items) {
  const tbody = document.getElementById('inquiries-tbody');
  if (!items || items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--admin-muted);">
          No customer inquiries received yet. Submissions from product.html and contact.html will appear here.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items.map((item) => {
    const source = item.source || (item.product_title ? 'Product Quote' : 'Studio Appointment');
    const status = item.status || 'New';
    const statusClass = `status-${status.toLowerCase().replace(/\s+/g, '')}`;
    const fileUrl = item.reference_file_url || item.uploaded_file_url;
    const fileName = item.reference_file_name || 'Download File';

    // Format WhatsApp reply message
    const replyText = encodeURIComponent(
      `Hello ${item.full_name},\nThank you for reaching out to Tridimensional Creation regarding your inquiry for "${item.product_title || item.service_type || 'Custom Fabrication'}".\nOur design & engineering team reviewed your request and would like to share the next steps.`
    );
    const waUrl = item.phone ? `https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=${replyText}` : `https://wa.me/${STUDIO_PHONE}?text=${replyText}`;

    const dims = [item.width_x, item.height_y, item.thickness_z].filter(Boolean).join(' × ') || 'Standard';

    return `
      <tr data-id="${item.id}">
        <td style="white-space: nowrap; font-size: 0.75rem;">${formatDate(item.created_at)}</td>
        <td><span class="source-badge">${source}</span></td>
        <td>
          <strong style="color: var(--admin-primary);">${item.full_name || 'Anonymous'}</strong>
        </td>
        <td>
          <div style="font-size: 0.75rem;">
            ${item.phone ? `<div><a href="tel:${item.phone}" style="color: inherit; text-decoration: none;">📞 ${item.phone}</a></div>` : ''}
            ${item.email ? `<div><a href="mailto:${item.email}" style="color: var(--admin-muted);">✉️ ${item.email}</a></div>` : ''}
          </div>
        </td>
        <td>
          <div style="font-weight: 600;">${item.product_title || item.service_type || 'General Fabrication'}</div>
          ${item.message ? `<div style="font-size: 0.7rem; color: var(--admin-muted); max-width: 260px; line-height: 1.3;">${item.message}</div>` : ''}
          ${item.appointment_date ? `<div style="font-size: 0.6875rem; color: var(--admin-primary); margin-top: 3px;">📅 Preferred: ${item.appointment_date}</div>` : ''}
        </td>
        <td style="font-size: 0.75rem; white-space: nowrap;">${dims}</td>
        <td>
          ${fileUrl ? `
            <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="admin-btn admin-btn-secondary admin-btn-sm" style="font-size: 0.7rem;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              View File
            </a>
          ` : '<span style="color: var(--admin-muted); font-size: 0.75rem;">No file</span>'}
        </td>
        <td>
          <select class="admin-select inquiry-status-select" data-id="${item.id}" style="padding: 0.3rem 0.5rem; font-size: 0.75rem;">
            <option value="New" ${status === 'New' ? 'selected' : ''}>New</option>
            <option value="Reviewed" ${status === 'Reviewed' ? 'selected' : ''}>Reviewed</option>
            <option value="In Production" ${status === 'In Production' ? 'selected' : ''}>In Production</option>
            <option value="Completed" ${status === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="admin-btn admin-btn-success admin-btn-sm" title="Reply on WhatsApp">
              WhatsApp
            </a>
            <button class="admin-btn admin-btn-danger admin-btn-sm delete-inquiry-btn" data-id="${item.id}">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach status change listeners
  tbody.querySelectorAll('.inquiry-status-select').forEach((select) => {
    select.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const newStatus = e.target.value;
      try {
        await supabase
          .from('customer_inquiries')
          .update({ status: newStatus })
          .eq('id', id);
        showToast(`Status updated to "${newStatus}".`);
      } catch (err) {
        showToast('Error updating status: ' + err.message, true);
      }
    });
  });

  // Attach delete listeners
  tbody.querySelectorAll('.delete-inquiry-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this customer inquiry?')) {
        try {
          await supabase.from('customer_inquiries').delete().eq('id', id);
          await supabase.from('quotes_and_appointments').delete().eq('id', id);
          showToast('Inquiry deleted.');
          loadInquiries();
        } catch (err) {
          showToast('Error deleting inquiry: ' + err.message, true);
        }
      }
    });
  });
}

function initInquiriesSearch() {
  const searchInput = document.getElementById('inquiries-search');
  const refreshBtn = document.getElementById('refresh-inquiries-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = state.inquiries.filter((item) => {
        return (
          (item.full_name && item.full_name.toLowerCase().includes(q)) ||
          (item.email && item.email.toLowerCase().includes(q)) ||
          (item.phone && item.phone.toLowerCase().includes(q)) ||
          (item.product_title && item.product_title.toLowerCase().includes(q))
        );
      });
      renderInquiriesTable(filtered);
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadInquiries();
      showToast('Inquiries refreshed.');
    });
  }
}

// ==============================================================================
// 5. TAB 2: PORTFOLIO GALLERIES CONTROLLER
// ==============================================================================
async function loadPortfolio() {
  const tbody = document.getElementById('portfolio-tbody');
  const countBadge = document.getElementById('count-portfolio');
  const countLabel = document.getElementById('portfolio-count-label');

  try {
    const { data, error } = await supabase
      .from('portfolio_galleries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    state.portfolio = data || [];
    countBadge.textContent = state.portfolio.length;
    countLabel.textContent = state.portfolio.length;
    renderPortfolioTable(state.portfolio);
  } catch (err) {
    console.warn('Error loading portfolio:', err.message);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-muted);">Using local fallback records.</td></tr>`;
  }
}

function renderPortfolioTable(items) {
  const tbody = document.getElementById('portfolio-tbody');
  if (!items || items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--admin-muted);">
          No portfolio items in database. Add your first showcase photo using the form above.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items.map((item) => `
    <tr>
      <td>
        <img src="${item.image_url}" alt="${item.title}" style="width: 54px; height: 54px; object-fit: cover; border-radius: 4px; border: 1px solid var(--admin-border);" />
      </td>
      <td>
        <strong style="color: var(--admin-primary);">${item.title}</strong>
        ${item.caption ? `<div style="font-size: 0.7rem; color: var(--admin-muted); max-width: 280px;">${item.caption}</div>` : ''}
      </td>
      <td><span class="source-badge">${item.category}</span></td>
      <td style="font-size: 0.75rem;">${item.sub_gallery || 'all'}</td>
      <td style="font-size: 0.75rem;">${item.specs_chip || '—'}</td>
      <td>
        <div style="display: flex; gap: 0.35rem;">
          <button class="admin-btn admin-btn-secondary admin-btn-sm edit-portfolio-btn" data-id="${item.id}">Edit</button>
          <button class="admin-btn admin-btn-danger admin-btn-sm delete-portfolio-btn" data-id="${item.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Attach Edit Handlers
  tbody.querySelectorAll('.edit-portfolio-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = state.portfolio.find((p) => String(p.id) === String(id));
      if (!item) return;

      document.getElementById('portfolio-edit-id').value = item.id;
      document.getElementById('portfolio-title').value = item.title || '';
      document.getElementById('portfolio-category').value = item.category || '2D CNC Router Works';
      document.getElementById('portfolio-subgallery').value = item.sub_gallery || 'all';
      document.getElementById('portfolio-caption').value = item.caption || '';
      document.getElementById('portfolio-specs').value = item.specs_chip || '';

      const previewWrap = document.getElementById('portfolio-preview-wrap');
      const previewImg = document.getElementById('portfolio-preview-img');
      const previewName = document.getElementById('portfolio-preview-name');
      if (previewWrap && previewImg && previewName) {
        previewWrap.style.display = 'flex';
        previewImg.src = item.image_url;
        previewName.textContent = 'Existing image on file (drag to replace)';
      }

      document.getElementById('portfolio-form-heading').textContent = 'Edit Portfolio Item: ' + item.title;
      document.getElementById('portfolio-submit-btn').textContent = 'Update Portfolio Item';
      document.getElementById('cancel-portfolio-edit-btn').style.display = 'inline-block';
      window.scrollTo({ top: document.getElementById('tab-portfolio').offsetTop - 80, behavior: 'smooth' });
    });
  });

  // Attach Delete Handlers
  tbody.querySelectorAll('.delete-portfolio-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Delete this portfolio showcase item from database?')) {
        try {
          await supabase.from('portfolio_galleries').delete().eq('id', id);
          showToast('Portfolio item removed.');
          loadPortfolio();
        } catch (err) {
          showToast('Error deleting item: ' + err.message, true);
        }
      }
    });
  });
}

function initPortfolioForm() {
  const form = document.getElementById('portfolio-form');
  const cancelBtn = document.getElementById('cancel-portfolio-edit-btn');

  setupDropZone(
    'portfolio-drop-zone',
    'portfolio-file-input',
    'portfolio-preview-wrap',
    'portfolio-preview-img',
    'portfolio-preview-name',
    'portfolio'
  );

  cancelBtn.addEventListener('click', () => {
    form.reset();
    document.getElementById('portfolio-edit-id').value = '';
    document.getElementById('portfolio-form-heading').textContent = 'Add Portfolio Showcase Item';
    document.getElementById('portfolio-submit-btn').textContent = 'Save to Portfolio';
    cancelBtn.style.display = 'none';
    clearDropZonePreview('portfolio-preview-wrap', 'portfolio-preview-img', 'portfolio-preview-name', 'portfolio');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('portfolio-edit-id').value;
    const title = document.getElementById('portfolio-title').value.trim();
    const category = document.getElementById('portfolio-category').value;
    const sub_gallery = document.getElementById('portfolio-subgallery').value;
    const caption = document.getElementById('portfolio-caption').value.trim();
    const specs_chip = document.getElementById('portfolio-specs').value.trim();
    const submitBtn = document.getElementById('portfolio-submit-btn');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading to gallery-images bucket...';

    try {
      let imageUrl = null;
      const file = state.uploadedFiles.portfolio;

      if (file) {
        const uploadRes = await uploadFileToBucket(BUCKETS.GALLERY_IMAGES, file);
        imageUrl = uploadRes.publicUrl;
      } else if (editId) {
        const existing = state.portfolio.find((p) => String(p.id) === String(editId));
        imageUrl = existing?.image_url;
      }

      if (!imageUrl) {
        throw new Error('Please select a project photograph to upload.');
      }

      const payload = {
        title,
        category,
        sub_gallery,
        caption,
        specs_chip,
        image_url: imageUrl
      };

      if (editId) {
        const { error } = await supabase
          .from('portfolio_galleries')
          .update(payload)
          .eq('id', editId);
        if (error) throw error;
        showToast('Portfolio item updated successfully.');
      } else {
        const { error } = await supabase
          .from('portfolio_galleries')
          .insert([payload]);
        if (error) throw error;
        showToast('Portfolio item published to gallery-images.');
      }

      cancelBtn.click();
      loadPortfolio();
    } catch (err) {
      showToast('Error saving portfolio item: ' + err.message, true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = editId ? 'Update Portfolio Item' : 'Save to Portfolio';
    }
  });
}

// ==============================================================================
// 6. TAB 3: 18 CATALOG CAPABILITIES CONTROLLER
// ==============================================================================
async function loadCatalog() {
  const tbody = document.getElementById('catalog-tbody');
  const countBadge = document.getElementById('count-catalog');
  const countLabel = document.getElementById('catalog-count-label');

  try {
    const { data, error } = await supabase
      .from('catalog_capabilities')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      state.catalog = data;
    } else {
      // Fallback to products.json if remote database is fresh
      const res = await fetch('/products.json');
      const json = await res.json();
      state.catalog = json || [];
    }

    countBadge.textContent = state.catalog.length;
    countLabel.textContent = state.catalog.length;
    renderCatalogTable(state.catalog);
  } catch (err) {
    console.warn('Error loading catalog capabilities:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-muted);">Catalog ready.</td></tr>`;
  }
}

function renderCatalogTable(items) {
  const tbody = document.getElementById('catalog-tbody');
  if (!items || items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--admin-muted);">
          No capabilities found. Click "Seed 18 Default Catalog Products" above to populate immediately.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items.map((item) => {
    const imgUrl = item.image_url || item.image_placeholder || '/Images/cnc-leaf-petals-door-grill.svg';
    const materials = item.tech_specs?.materials || 'HDHMR, Hardwood, Acrylic';

    return `
      <tr>
        <td>
          <img src="${imgUrl}" alt="${item.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid var(--admin-border);" />
        </td>
        <td>
          <strong style="color: var(--admin-primary);">${item.title}</strong>
        </td>
        <td><span class="source-badge">${item.category}</span></td>
        <td><code>${item.slug || item.id}</code></td>
        <td style="font-size: 0.75rem; max-width: 200px;">${materials}</td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="admin-btn admin-btn-secondary admin-btn-sm edit-catalog-btn" data-slug="${item.slug || item.id}">Edit</button>
            <button class="admin-btn admin-btn-danger admin-btn-sm delete-catalog-btn" data-slug="${item.slug || item.id}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach Edit Handlers
  tbody.querySelectorAll('.edit-catalog-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slug = btn.getAttribute('data-slug');
      const item = state.catalog.find((c) => (c.slug || c.id) === slug);
      if (!item) return;

      document.getElementById('catalog-edit-id').value = item.slug || item.id;
      document.getElementById('catalog-slug').value = item.slug || item.id;
      document.getElementById('catalog-category').value = item.category || '2D CNC Router Works';
      document.getElementById('catalog-title').value = item.title || '';
      document.getElementById('catalog-description').value = item.description || '';
      document.getElementById('catalog-design-scope').value = Array.isArray(item.design_scope) ? item.design_scope.join('\n') : '';
      document.getElementById('catalog-where-to-use').value = Array.isArray(item.where_to_use) ? item.where_to_use.join('\n') : '';
      document.getElementById('catalog-thickness').value = item.tech_specs?.thickness || '';
      document.getElementById('catalog-materials').value = item.tech_specs?.materials || '';
      document.getElementById('catalog-finishes').value = item.tech_specs?.finishes || '';
      document.getElementById('catalog-customization').value = item.customization || '';

      const previewWrap = document.getElementById('catalog-preview-wrap');
      const previewImg = document.getElementById('catalog-preview-img');
      const previewName = document.getElementById('catalog-preview-name');
      if (previewWrap && previewImg && previewName) {
        previewWrap.style.display = 'flex';
        previewImg.src = item.image_url || item.image_placeholder;
        previewName.textContent = 'Existing capability image on file';
      }

      document.getElementById('catalog-form-heading').textContent = 'Edit Capability: ' + item.title;
      document.getElementById('catalog-submit-btn').textContent = 'Update Capability Specs';
      document.getElementById('cancel-catalog-edit-btn').style.display = 'inline-block';
      window.scrollTo({ top: document.getElementById('tab-catalog').offsetTop - 80, behavior: 'smooth' });
    });
  });

  // Attach Delete Handlers
  tbody.querySelectorAll('.delete-catalog-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const slug = btn.getAttribute('data-slug');
      if (confirm(`Delete catalog capability "${slug}" from database?`)) {
        try {
          await supabase.from('catalog_capabilities').delete().eq('slug', slug);
          showToast('Catalog capability removed.');
          loadCatalog();
        } catch (err) {
          showToast('Error deleting item: ' + err.message, true);
        }
      }
    });
  });
}

function initCatalogForm() {
  const form = document.getElementById('catalog-form');
  const cancelBtn = document.getElementById('cancel-catalog-edit-btn');
  const seedBtn = document.getElementById('seed-catalog-btn');

  setupDropZone(
    'catalog-drop-zone',
    'catalog-file-input',
    'catalog-preview-wrap',
    'catalog-preview-img',
    'catalog-preview-name',
    'catalog'
  );

  cancelBtn.addEventListener('click', () => {
    form.reset();
    document.getElementById('catalog-edit-id').value = '';
    document.getElementById('catalog-form-heading').textContent = 'Manage Fabrication Capability';
    document.getElementById('catalog-submit-btn').textContent = 'Save Catalog Capability';
    cancelBtn.style.display = 'none';
    clearDropZonePreview('catalog-preview-wrap', 'catalog-preview-img', 'catalog-preview-name', 'catalog');
  });

  // Seed 18 Default Catalog Products from /products.json
  seedBtn.addEventListener('click', async () => {
    seedBtn.disabled = true;
    seedBtn.textContent = 'Importing 18 products...';
    try {
      const res = await fetch('/products.json');
      const items = await res.json();

      let successCount = 0;
      for (const item of items) {
        const payload = {
          id: item.id,
          slug: item.id,
          category: item.category,
          title: item.title,
          description: item.description,
          design_scope: item.design_scope,
          where_to_use: item.where_to_use,
          tech_specs: item.tech_specs,
          customization: item.customization,
          image_url: item.image_placeholder
        };

        const { error } = await supabase
          .from('catalog_capabilities')
          .upsert([payload], { onConflict: 'slug' });
        if (!error) successCount++;
      }

      showToast(`Successfully seeded ${successCount} products into catalog_capabilities!`);
      loadCatalog();
    } catch (err) {
      showToast('Error seeding catalog: ' + err.message, true);
    } finally {
      seedBtn.disabled = false;
      seedBtn.textContent = 'Seed 18 Default Catalog Products';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('catalog-edit-id').value;
    const slug = document.getElementById('catalog-slug').value.trim();
    const category = document.getElementById('catalog-category').value;
    const title = document.getElementById('catalog-title').value.trim();
    const description = document.getElementById('catalog-description').value.trim();
    const design_scope = document.getElementById('catalog-design-scope').value.split('\n').map((s) => s.trim()).filter(Boolean);
    const where_to_use = document.getElementById('catalog-where-to-use').value.split('\n').map((s) => s.trim()).filter(Boolean);
    const thickness = document.getElementById('catalog-thickness').value.trim();
    const materials = document.getElementById('catalog-materials').value.trim();
    const finishes = document.getElementById('catalog-finishes').value.trim();
    const customization = document.getElementById('catalog-customization').value.trim();
    const submitBtn = document.getElementById('catalog-submit-btn');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving to catalog-images bucket...';

    try {
      let imageUrl = null;
      const file = state.uploadedFiles.catalog;

      if (file) {
        const uploadRes = await uploadFileToBucket(BUCKETS.CATALOG_IMAGES, file);
        imageUrl = uploadRes.publicUrl;
      } else if (editId) {
        const existing = state.catalog.find((c) => (c.slug || c.id) === editId);
        imageUrl = existing?.image_url || existing?.image_placeholder;
      }

      if (!imageUrl) {
        imageUrl = '/Images/cnc-leaf-petals-door-grill.svg';
      }

      const payload = {
        id: slug,
        slug,
        category,
        title,
        description,
        design_scope,
        where_to_use,
        tech_specs: { thickness, materials, finishes },
        customization,
        image_url: imageUrl
      };

      const { error } = await supabase
        .from('catalog_capabilities')
        .upsert([payload], { onConflict: 'slug' });

      if (error) throw error;
      showToast('Catalog capability saved successfully.');
      cancelBtn.click();
      loadCatalog();
    } catch (err) {
      showToast('Error saving capability: ' + err.message, true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Catalog Capability';
    }
  });
}

// ==============================================================================
// 7. TAB 4: BLOG & ARTICLE PUBLISHER CONTROLLER
// ==============================================================================
async function loadBlogs() {
  const tbody = document.getElementById('blogs-tbody');
  const countBadge = document.getElementById('count-blogs');
  const countLabel = document.getElementById('blogs-count-label');

  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('published_date', { ascending: false });

    if (error) throw error;
    state.blogs = data || [];
    countBadge.textContent = state.blogs.length;
    countLabel.textContent = state.blogs.length;
    renderBlogsTable(state.blogs);
  } catch (err) {
    console.warn('Error loading blogs:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-muted);">Articles ready.</td></tr>`;
  }
}

function renderBlogsTable(items) {
  const tbody = document.getElementById('blogs-tbody');
  if (!items || items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--admin-muted);">
          No published journal articles found. Write your first article above.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items.map((item) => `
    <tr>
      <td>
        <img src="${item.cover_image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'}" alt="${item.title}" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid var(--admin-border);" />
      </td>
      <td>
        <strong style="color: var(--admin-primary);">${item.title}</strong>
        <div style="font-size: 0.7rem; color: var(--admin-muted); max-width: 300px;">${item.summary || ''}</div>
      </td>
      <td><span class="source-badge">${item.category_badge || 'CNC Engineering'}</span></td>
      <td style="font-size: 0.75rem;">${item.author || 'K. Sanjeev Singha'}</td>
      <td style="font-size: 0.75rem; white-space: nowrap;">${formatDate(item.published_date || item.created_at)}</td>
      <td>
        <div style="display: flex; gap: 0.35rem;">
          <a href="article.html?id=${item.id}" target="_blank" class="admin-btn admin-btn-secondary admin-btn-sm">View</a>
          <button class="admin-btn admin-btn-secondary admin-btn-sm edit-blog-btn" data-id="${item.id}">Edit</button>
          <button class="admin-btn admin-btn-danger admin-btn-sm delete-blog-btn" data-id="${item.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Attach Edit Handlers
  tbody.querySelectorAll('.edit-blog-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = state.blogs.find((b) => String(b.id) === String(id));
      if (!item) return;

      document.getElementById('blog-edit-id').value = item.id;
      document.getElementById('blog-title').value = item.title || '';
      document.getElementById('blog-category').value = item.category_badge || 'CNC Engineering';
      document.getElementById('blog-reading-time').value = item.reading_time || '5 min read';
      document.getElementById('blog-author').value = item.author || 'K. Sanjeev Singha';
      document.getElementById('blog-summary').value = item.summary || '';
      document.getElementById('blog-content').value = item.content || '';

      const previewWrap = document.getElementById('blog-preview-wrap');
      const previewImg = document.getElementById('blog-preview-img');
      const previewName = document.getElementById('blog-preview-name');
      if (previewWrap && previewImg && previewName) {
        previewWrap.style.display = 'flex';
        previewImg.src = item.cover_image;
        previewName.textContent = 'Existing cover photo on file';
      }

      document.getElementById('blog-form-heading').textContent = 'Edit Journal Article: ' + item.title;
      document.getElementById('blog-submit-btn').textContent = 'Update Article';
      document.getElementById('cancel-blog-edit-btn').style.display = 'inline-block';
      window.scrollTo({ top: document.getElementById('tab-blogs').offsetTop - 80, behavior: 'smooth' });
    });
  });

  // Attach Delete Handlers
  tbody.querySelectorAll('.delete-blog-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Delete this article from the studio journal?')) {
        try {
          await supabase.from('blogs').delete().eq('id', id);
          showToast('Article deleted.');
          loadBlogs();
        } catch (err) {
          showToast('Error deleting article: ' + err.message, true);
        }
      }
    });
  });
}

function initBlogForm() {
  const form = document.getElementById('blog-form');
  const cancelBtn = document.getElementById('cancel-blog-edit-btn');

  setupDropZone(
    'blog-drop-zone',
    'blog-file-input',
    'blog-preview-wrap',
    'blog-preview-img',
    'blog-preview-name',
    'blog'
  );

  cancelBtn.addEventListener('click', () => {
    form.reset();
    document.getElementById('blog-edit-id').value = '';
    document.getElementById('blog-form-heading').textContent = 'Publish Studio Journal Article';
    document.getElementById('blog-submit-btn').textContent = 'Publish Article';
    cancelBtn.style.display = 'none';
    clearDropZonePreview('blog-preview-wrap', 'blog-preview-img', 'blog-preview-name', 'blog');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('blog-edit-id').value;
    const title = document.getElementById('blog-title').value.trim();
    const category_badge = document.getElementById('blog-category').value;
    const reading_time = document.getElementById('blog-reading-time').value.trim();
    const author = document.getElementById('blog-author').value.trim();
    const summary = document.getElementById('blog-summary').value.trim();
    const content = document.getElementById('blog-content').value.trim();
    const submitBtn = document.getElementById('blog-submit-btn');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading to blog-images bucket...';

    try {
      let coverUrl = null;
      const file = state.uploadedFiles.blog;

      if (file) {
        const uploadRes = await uploadFileToBucket(BUCKETS.BLOG_IMAGES, file);
        coverUrl = uploadRes.publicUrl;
      } else if (editId) {
        const existing = state.blogs.find((b) => String(b.id) === String(editId));
        coverUrl = existing?.cover_image;
      }

      if (!coverUrl) {
        coverUrl = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80';
      }

      const payload = {
        title,
        category_badge,
        reading_time,
        author,
        summary,
        content,
        cover_image: coverUrl,
        published_date: new Date().toISOString()
      };

      if (editId) {
        const { error } = await supabase.from('blogs').update(payload).eq('id', editId);
        if (error) throw error;
        showToast('Article updated successfully.');
      } else {
        const { error } = await supabase.from('blogs').insert([payload]);
        if (error) throw error;
        showToast('Article published to Studio Journal.');
      }

      cancelBtn.click();
      loadBlogs();
    } catch (err) {
      showToast('Error publishing article: ' + err.message, true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Publish Article';
    }
  });
}

// ==============================================================================
// 8. TAB 5: HOME & ABOUT PAGE ASSETS CONTROLLER
// ==============================================================================
async function loadAssets() {
  const tbody = document.getElementById('assets-tbody');
  const countBadge = document.getElementById('count-assets');
  const countLabel = document.getElementById('assets-count-label');

  try {
    const { data, error } = await supabase
      .from('page_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    state.assets = data || [];
    countBadge.textContent = state.assets.length;
    countLabel.textContent = state.assets.length;
    renderAssetsTable(state.assets);
  } catch (err) {
    console.warn('Error loading page assets:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-muted);">Site assets ready.</td></tr>`;
  }
}

function renderAssetsTable(items) {
  const tbody = document.getElementById('assets-tbody');
  if (!items || items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--admin-muted);">
          No custom page assets saved. Use the form above to add marquee slides or foundation photos.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items.map((item) => `
    <tr>
      <td>
        <img src="${item.image_url}" alt="${item.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid var(--admin-border);" />
      </td>
      <td><strong>${item.page_name.toUpperCase()}</strong></td>
      <td><code>${item.section_name}</code></td>
      <td>${item.title}</td>
      <td style="font-size: 0.75rem;">${formatDate(item.created_at)}</td>
      <td>
        <div style="display: flex; gap: 0.35rem;">
          <button class="admin-btn admin-btn-secondary admin-btn-sm edit-asset-btn" data-id="${item.id}">Edit</button>
          <button class="admin-btn admin-btn-danger admin-btn-sm delete-asset-btn" data-id="${item.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Attach Edit Handlers
  tbody.querySelectorAll('.edit-asset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = state.assets.find((a) => String(a.id) === String(id));
      if (!item) return;

      document.getElementById('asset-edit-id').value = item.id;
      document.getElementById('asset-page').value = item.page_name || 'home';
      document.getElementById('asset-section').value = item.section_name || 'home-marquee';
      document.getElementById('asset-title').value = item.title || '';

      const previewWrap = document.getElementById('asset-preview-wrap');
      const previewImg = document.getElementById('asset-preview-img');
      const previewName = document.getElementById('asset-preview-name');
      if (previewWrap && previewImg && previewName) {
        previewWrap.style.display = 'flex';
        previewImg.src = item.image_url;
        previewName.textContent = 'Existing asset image on file';
      }

      document.getElementById('asset-form-heading').textContent = 'Edit Page Asset: ' + item.title;
      document.getElementById('asset-submit-btn').textContent = 'Update Page Asset';
      document.getElementById('cancel-asset-edit-btn').style.display = 'inline-block';
      window.scrollTo({ top: document.getElementById('tab-assets').offsetTop - 80, behavior: 'smooth' });
    });
  });

  // Attach Delete Handlers
  tbody.querySelectorAll('.delete-asset-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Delete this page asset from database?')) {
        try {
          await supabase.from('page_assets').delete().eq('id', id);
          showToast('Page asset deleted.');
          loadAssets();
        } catch (err) {
          showToast('Error deleting asset: ' + err.message, true);
        }
      }
    });
  });
}

function initAssetForm() {
  const form = document.getElementById('asset-form');
  const cancelBtn = document.getElementById('cancel-asset-edit-btn');

  setupDropZone(
    'asset-drop-zone',
    'asset-file-input',
    'asset-preview-wrap',
    'asset-preview-img',
    'asset-preview-name',
    'asset'
  );

  cancelBtn.addEventListener('click', () => {
    form.reset();
    document.getElementById('asset-edit-id').value = '';
    document.getElementById('asset-form-heading').textContent = 'Upload Page Visual Asset';
    document.getElementById('asset-submit-btn').textContent = 'Save Page Asset';
    cancelBtn.style.display = 'none';
    clearDropZonePreview('asset-preview-wrap', 'asset-preview-img', 'asset-preview-name', 'asset');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('asset-edit-id').value;
    const page_name = document.getElementById('asset-page').value;
    const section_name = document.getElementById('asset-section').value;
    const title = document.getElementById('asset-title').value.trim();
    const submitBtn = document.getElementById('asset-submit-btn');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading to site-assets bucket...';

    try {
      let imageUrl = null;
      const file = state.uploadedFiles.asset;

      if (file) {
        const uploadRes = await uploadFileToBucket(BUCKETS.SITE_ASSETS, file);
        imageUrl = uploadRes.publicUrl;
      } else if (editId) {
        const existing = state.assets.find((a) => String(a.id) === String(editId));
        imageUrl = existing?.image_url;
      }

      if (!imageUrl) {
        throw new Error('Please select an asset photo to upload.');
      }

      const payload = {
        page_name,
        section_name,
        title,
        image_url: imageUrl
      };

      if (editId) {
        const { error } = await supabase.from('page_assets').update(payload).eq('id', editId);
        if (error) throw error;
        showToast('Page asset updated successfully.');
      } else {
        const { error } = await supabase.from('page_assets').insert([payload]);
        if (error) throw error;
        showToast('Page asset added to site-assets.');
      }

      cancelBtn.click();
      loadAssets();
    } catch (err) {
      showToast('Error saving asset: ' + err.message, true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Page Asset';
    }
  });
}

// ==============================================================================
// 9. INITIALIZE MASTER CONTROLLER
// ==============================================================================
function loadAllDashboardData() {
  loadInquiries();
  loadPortfolio();
  loadCatalog();
  loadBlogs();
  loadAssets();
}

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initTabs();
  initInquiriesSearch();
  initPortfolioForm();
  initCatalogForm();
  initBlogForm();
  initAssetForm();
});
