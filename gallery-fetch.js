/**
 * Tridimensional Creations — Dynamic Portfolio Gallery
 * Connects securely to Supabase, queries the 'portfolio_galleries' table,
 * renders responsive project cards into .gallery-grid, and handles interactive category filtering.
 * Supports gallery.html as well as gallery-decor.html, gallery-furniture.html, gallery-retail.html, and gallery-art.html.
 */

import { supabase } from './supabaseClient.js';

// Global reference to store fetched records for live in-memory filtering
let portfolioRecords = [];

/**
 * Curated production fallback records in case remote database is currently empty
 */
const fallbackRecords = [
  {
    id: 'fb-1',
    category: 'Home Decor',
    sub_gallery: 'decor',
    title: 'Geometric Statement Wall Clock',
    caption: 'Precision CNC pocketing with hand-inlaid polished brass indices and moisture-cured satin lacquer on seasoned teak.',
    specs_chip: 'Substrate: Teak Hardwood + Brass • Diameter: 32"',
    image_url: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'fb-2',
    category: 'Home Decor',
    sub_gallery: 'decor',
    title: 'Architectural HDHMR Jali Partition',
    caption: 'Zero-burr cut-through fretwork with radiant floral geometry, factory pre-primed in PU matte white.',
    specs_chip: 'Substrate: 18mm HDHMR • Height: 8ft',
    image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'fb-3',
    category: 'Furniture & Woodworking',
    sub_gallery: 'furniture',
    title: 'Parametric Acoustic Fluted Console Table',
    caption: 'Computational wave contouring machined from dense Baltic Birch ply layers with integrated concealed cable runs.',
    specs_chip: 'Baltic Birch Plywood • Clear Matte Polyurethane',
    image_url: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'fb-4',
    category: 'Furniture & Woodworking',
    sub_gallery: 'furniture',
    title: 'Carved Solid Teak Main Entrance Shutter',
    caption: '3D high-relief door panel sculpted with traditional ethnic iconography and moisture-resistant exterior coating.',
    specs_chip: 'Seasoned CP Teak • Thickness: 45mm',
    image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'fb-5',
    category: 'Retail & Event Displays',
    sub_gallery: 'retail',
    title: 'Precision 3D Backlit Corporate Reception Logo',
    caption: 'Multi-tiered dimensional sign with chamfered aluminum composite edges and diffused 3000K LED halo lighting.',
    specs_chip: 'Acrylic + Brushed Brass Finish',
    image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'fb-6',
    category: 'Figurines & Art',
    sub_gallery: 'art',
    title: 'High-Precision 8K Resin Sacred Deity Murti',
    caption: 'Micro-sculpted in ZBrush with 0.025mm layer heights in engineering resin, hand-patinated in antique bronze.',
    specs_chip: '8K Photopolymer Resin • Height: 12"',
    image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80'
  }
];

/**
 * Normalizes category string for comparative filtering
 */
function normalizeCategory(cat) {
  if (!cat) return '';
  const lower = cat.toLowerCase();
  if (lower.includes('decor')) return 'decor';
  if (lower.includes('furnit') || lower.includes('wood')) return 'furniture';
  if (lower.includes('retail') || lower.includes('display')) return 'retail';
  if (lower.includes('art') || lower.includes('figurin') || lower.includes('resin') || lower.includes('sculpt')) return 'art';
  if (lower.includes('cnc')) return 'cnc';
  return lower;
}

/**
 * Detects if current page is a specific sub-gallery page
 */
function detectCurrentSubGallery() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('gallery-decor')) return 'decor';
  if (path.includes('gallery-furniture')) return 'furniture';
  if (path.includes('gallery-retail')) return 'retail';
  if (path.includes('gallery-art')) return 'art';
  return null;
}

/**
 * Renders gallery item cards into the container strictly using existing CSS classes
 */
function renderGalleryCards(container, records) {
  container.innerHTML = '';

  if (!records || records.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.style.gridColumn = '1 / -1';
    emptyState.style.padding = '3rem 1rem';
    emptyState.style.textAlign = 'center';
    emptyState.style.color = '#6B1326';
    emptyState.innerHTML = `
      <p style="font-family: 'Montserrat', sans-serif; font-size: 1rem; margin-bottom: 0.5rem; font-weight: 600;">
        No portfolio items found in this discipline.
      </p>
      <p style="font-size: 0.85rem; opacity: 0.8;">
        New physical commissions are continuously uploaded via the Studio Admin Desk.
      </p>
    `;
    container.appendChild(emptyState);
    return;
  }

  const fragment = document.createDocumentFragment();

  records.forEach((record) => {
    const categoryName = record.category || 'Custom Fabrication';
    const titleText = record.title || 'Atelier Commission';
    const imageUrl = record.image_url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
    const normCat = normalizeCategory(categoryName);
    const caption = record.caption;
    const specsChip = record.specs_chip;

    // Strict requirement: Wrap each item in <a href="#" class="gallery-item">
    const cardLink = document.createElement('a');
    cardLink.href = '#';
    cardLink.className = 'gallery-item';
    cardLink.dataset.category = normCat;
    cardLink.dataset.subGallery = record.sub_gallery || 'all';

    // Image container: <div class="gallery-image-wrap"><img src="[image_url]" loading="lazy" alt="[title]"></div>
    const imgWrap = document.createElement('div');
    imgWrap.className = 'gallery-image-wrap';

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = titleText;
    img.loading = 'lazy';
    img.onerror = () => {
      img.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
    };

    imgWrap.appendChild(img);
    cardLink.appendChild(imgWrap);

    // Info container: <div class="gallery-info">
    const infoWrap = document.createElement('div');
    infoWrap.className = 'gallery-info';

    // Category tag: <span class="gallery-tag">[category]</span>
    const catTag = document.createElement('span');
    catTag.className = 'gallery-tag';
    catTag.textContent = categoryName;
    infoWrap.appendChild(catTag);

    // Title: <h3 class="gallery-title">[title]</h3>
    const titleEl = document.createElement('h3');
    titleEl.className = 'gallery-title';
    titleEl.textContent = titleText;
    infoWrap.appendChild(titleEl);

    // Optional short caption
    if (caption) {
      const captionEl = document.createElement('p');
      captionEl.className = 'gallery-caption';
      captionEl.textContent = caption;
      infoWrap.appendChild(captionEl);
    }

    // Optional technical specs chip
    if (specsChip) {
      const chipEl = document.createElement('div');
      chipEl.className = 'gallery-specs-chip';
      chipEl.innerHTML = `<span>${specsChip}</span>`;
      infoWrap.appendChild(chipEl);
    }

    cardLink.appendChild(infoWrap);
    fragment.appendChild(cardLink);
  });

  container.appendChild(fragment);
}

/**
 * Filter gallery cards based on selected category
 */
function filterCards(categoryKey, container) {
  const normalizedKey = (categoryKey || 'all').toLowerCase().trim();

  if (normalizedKey === 'all') {
    renderGalleryCards(container, portfolioRecords);
    return;
  }

  const filtered = portfolioRecords.filter((record) => {
    const itemNorm = normalizeCategory(record.category);
    const subGal = (record.sub_gallery || '').toLowerCase().trim();
    const rawLower = (record.category || '').toLowerCase();
    return subGal === normalizedKey || itemNorm === normalizedKey || rawLower.includes(normalizedKey) || normalizedKey.includes(itemNorm);
  });

  renderGalleryCards(container, filtered);
}

/**
 * Attaches click event listeners to .gallery-tab-btn buttons
 */
function setupCategoryFiltering(container) {
  const tabButtons = document.querySelectorAll('.gallery-tab-btn');
  if (!tabButtons || tabButtons.length === 0) return;

  const titleMap = {
    'all': 'All Production Disciplines',
    'decor': 'Custom Home Decor',
    'furniture': 'Furniture & Woodworking',
    'retail': 'Retail & Event Displays',
    'art': 'Figurines & Art Sculptures'
  };

  const descMap = {
    'all': 'A curated photographic collection of custom physical commissions fabricated at our Guwahati atelier—featuring high-torque CNC carving, parametric wall relief claddings, and high-detail resin 3D printing.',
    'decor': 'Bespoke clocks, carved pooja room backdrops, intricate jali partitions, nameplates, and sculptural interior statement pieces tailored to your exact floor plan.',
    'furniture': 'Continuous wardrobe surface textures, carved main entrance door shutters, fluted cabinet panels, and organic parametric acoustic wave structures.',
    'retail': '3D corporate reception backdrops, chiseled signage, branded retail pedestals, and experiential commercial event centerpieces.',
    'art': 'High-precision resin deity murti figurines, lifelike memorial portrait busts, and intricate collectibles digitally sculpted in ZBrush.'
  };

  const pageTitle = document.getElementById('gallery-page-title');
  const pageDesc = document.getElementById('gallery-page-desc');

  tabButtons.forEach((button) => {
    button.addEventListener('click', function (e) {
      e.preventDefault();

      const selectedCategory = this.dataset.category || this.dataset.filter || 'all';

      tabButtons.forEach((btn) => btn.classList.remove('active'));
      this.classList.add('active');

      const norm = selectedCategory.toLowerCase();
      if (titleMap[norm] && pageTitle) {
        pageTitle.textContent = titleMap[norm];
      }
      if (descMap[norm] && pageDesc) {
        pageDesc.textContent = descMap[norm];
      }

      filterCards(selectedCategory, container);
    });
  });

  // Check sub-gallery page or URL ?category=
  const subGalPage = detectCurrentSubGallery();
  const urlParams = new URLSearchParams(window.location.search);
  const targetCategory = subGalPage || urlParams.get('category');

  if (targetCategory && targetCategory !== 'all') {
    const matchingBtn = Array.from(tabButtons).find((btn) => {
      const cat = (btn.dataset.category || btn.dataset.filter || '').toLowerCase();
      return cat === targetCategory.toLowerCase();
    });

    if (matchingBtn) {
      matchingBtn.click();
    } else {
      filterCards(targetCategory, container);
    }
  }
}

/**
 * Main async function: queries Supabase portfolio_galleries and populates gallery
 */
export async function loadPortfolioGallery() {
  try {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;

    // Check if sub-gallery page
    const subGalPage = detectCurrentSubGallery();

    let fetchedData = null;
    if (supabase) {
      const { data, error } = await supabase
        .from('portfolio_galleries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase portfolio query note:', error.message);
      } else if (data && data.length > 0) {
        fetchedData = data;
      }
    }

    if (fetchedData && fetchedData.length > 0) {
      portfolioRecords = fetchedData;
    } else {
      portfolioRecords = fallbackRecords;
    }

    if (subGalPage) {
      const filteredForPage = portfolioRecords.filter((rec) => {
        const sub = (rec.sub_gallery || '').toLowerCase();
        const catNorm = normalizeCategory(rec.category);
        return sub === subGalPage || catNorm === subGalPage;
      });
      renderGalleryCards(galleryGrid, filteredForPage.length > 0 ? filteredForPage : portfolioRecords);
    } else {
      renderGalleryCards(galleryGrid, portfolioRecords);
    }

    setupCategoryFiltering(galleryGrid);
  } catch (err) {
    console.error('Unexpected error in loadPortfolioGallery:', err);
    const galleryGrid = document.querySelector('.gallery-grid');
    if (galleryGrid) {
      portfolioRecords = fallbackRecords;
      renderGalleryCards(galleryGrid, portfolioRecords);
      setupCategoryFiltering(galleryGrid);
    }
  }
}

// Auto-run when DOM is loaded
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPortfolioGallery);
  } else {
    loadPortfolioGallery();
  }
}

export default loadPortfolioGallery;
