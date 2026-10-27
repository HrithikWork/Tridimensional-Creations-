/**
 * Tridimensional Creations - Dynamic Homepage Marquee Fetch
 * Connects to Supabase v2 client and populates the infinite scrolling carousel.
 */

import { supabase as clientInstance } from './supabaseClient.js';

/**
 * Ensures an initialized Supabase v2 client is available
 */
async function getSupabaseClient() {
  if (clientInstance) {
    return clientInstance;
  }
  if (window._supabaseClientInstance) {
    return window._supabaseClientInstance;
  }
  if (window.supabaseClient) {
    return window.supabaseClient;
  }

  const SUPABASE_URL = (window.SUPABASE_URL || 'https://merpldiljqqirpognrlp.supabase.co').replace(/\/rest\/v1\/?$/, '');
  const SUPABASE_ANON_KEY = (window.SUPABASE_ANON_KEY || 'sb_publishable_ZJZ3JbP2ZJIrTh1VDm416A_aD2Q78cn').replace(/^\[|\]$/g, '');

  // Load Supabase JS v2 from CDN if not already on the page
  if (!window.supabase) {
    try {
      await new Promise((resolve, reject) => {
        const existingScript = document.querySelector('script[src*="@supabase/supabase-js"]');
        if (existingScript) {
          existingScript.addEventListener('load', resolve);
          existingScript.addEventListener('error', reject);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Supabase JS SDK'));
        document.head.appendChild(script);
      });
    } catch (err) {
      console.error('Error loading Supabase SDK:', err);
      return null;
    }
  }

  if (window.supabase && typeof window.supabase.createClient === 'function') {
    window._supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return window._supabaseClientInstance;
  }

  return null;
}

/**
 * Fetches the latest 8 image records from 'portfolio_galleries' and builds Set A & Set B
 */
export async function loadHomepageMarquee() {
  try {
    const marqueeTrack = document.querySelector('.infinite-marquee-section .marquee-track') || document.querySelector('.marquee-track');
    if (!marqueeTrack) {
      console.warn('Marquee track container (.marquee-track) not found in DOM.');
      return;
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase client could not be initialized. Keeping fallback showcase items.');
      return;
    }

    // Step 2: Fetch the latest 8 records from 'portfolio_galleries' selecting image_url and title
    const { data, error } = await supabase
      .from('portfolio_galleries')
      .select('image_url, title')
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      console.warn('Supabase portfolio_galleries notice:', error.message, '- Using aesthetic fallback items.');
      return;
    }

    if (!data || data.length === 0) {
      console.log('No portfolio gallery records returned. Maintaining fallback marquee items.');
      return;
    }

    // Step 3: Clear the innerHTML of the .marquee-track container
    marqueeTrack.innerHTML = '';

    // Step 4: Build "Set A"
    const setAFragment = document.createDocumentFragment();
    data.forEach((item) => {
      const slide = document.createElement('div');
      slide.className = 'marquee-slide';

      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.title || 'Tridimensional Creations Portfolio';
      img.loading = 'lazy';

      slide.appendChild(img);
      setAFragment.appendChild(slide);
    });

    // Step 5: Build "Set B" (Duplicate set with aria-hidden="true" for accessible infinite looping)
    const setBFragment = document.createDocumentFragment();
    data.forEach((item) => {
      const slide = document.createElement('div');
      slide.className = 'marquee-slide';
      slide.setAttribute('aria-hidden', 'true');

      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.title || '';
      img.loading = 'lazy';

      slide.appendChild(img);
      setBFragment.appendChild(slide);
    });

    // Step 6: Append both sets to .marquee-track
    marqueeTrack.appendChild(setAFragment);
    marqueeTrack.appendChild(setBFragment);

    console.log(`Successfully loaded ${data.length} showcase slides from Supabase portfolio_galleries.`);
  } catch (err) {
    console.error('Error in loadHomepageMarquee:', err);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.loadHomepageMarquee = loadHomepageMarquee;
}

// Auto-run when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHomepageMarquee);
  } else {
    loadHomepageMarquee();
  }
}
