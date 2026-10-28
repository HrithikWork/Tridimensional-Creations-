/**
 * Tridimensional Creation Pvt Ltd — Blog & Articles Dynamic Integration (blog-fetch.js)
 * Fetches published journal articles from Supabase 'blogs' table and renders them into
 * blog.html (architectural grid) and article.html (full editorial reading view).
 */

import { supabase } from './supabaseClient.js';

function formatDate(isoString) {
  if (!isoString) return 'Recent';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'Recent';
  }
}

/**
 * 1. Populate Blog Listing on blog.html
 */
export async function loadBlogGrid() {
  const grid = document.querySelector('.blog-architectural-grid');
  if (!grid) return;

  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('published_date', { ascending: false });

    if (error) {
      console.warn('Error fetching blogs from Supabase:', error.message);
      return; // Keep existing static markup if offline
    }

    if (!data || data.length === 0) {
      console.log('No blog records in Supabase blogs table yet. Keeping default articles.');
      return;
    }

    grid.innerHTML = data.map((post) => {
      const coverUrl = post.cover_image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
      const title = post.title || 'Studio Fabrication Journal';
      const category = post.category_badge || 'CNC Engineering';
      const readTime = post.reading_time || '5 Min';
      const summary = post.summary || 'A technical study into precision digital fabrication pipelines in Guwahati.';
      const dateText = formatDate(post.published_date || post.created_at);
      const articleUrl = `article.html?id=${encodeURIComponent(post.id)}`;

      return `
        <article class="blog-post-card">
          <a href="${articleUrl}" class="blog-card-media-link" aria-label="Read article on ${title}">
            <img 
              src="${coverUrl}" 
              alt="${title}" 
              loading="lazy" 
              style="width: 100%; height: 100%; object-fit: cover;"
              onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';"
            />
          </a>
          <div class="blog-post-content">
            <div class="blog-meta-bar">
              <span class="blog-badge">${category}</span>
              <time class="blog-timestamp">${dateText}</time>
            </div>
            <a href="${articleUrl}" class="blog-heading-link">
              <h2 class="blog-heading-title">${title}</h2>
            </a>
            <p class="blog-summary">${summary}</p>
            <div class="blog-action-row">
              <a href="${articleUrl}" class="btn-read-article" aria-label="Read full article on ${title}">
                Read Article <span>&rarr;</span>
              </a>
              <span class="reading-estimate" style="font-size: var(--text-2xs); color: var(--brand-accent); font-weight: 500;">
                ${readTime}
              </span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    console.log(`Successfully populated ${data.length} articles from Supabase blogs.`);
  } catch (err) {
    console.error('Failed to load blog grid:', err);
  }
}

/**
 * 2. Populate Full Article on article.html
 */
export async function loadArticleDetail() {
  const proseElem = document.querySelector('.article-prose');
  if (!proseElem) return;

  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');

  if (!articleId) return; // Keep standard sample article if no ?id= param

  try {
    const { data: post, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', articleId)
      .single();

    if (error || !post) {
      console.warn('Article not found in Supabase blogs, using default content.');
      return;
    }

    // Update Page Title & Metadata
    document.title = `${post.title} | Tridimensional Creation Studio Journal`;

    const titleEl = document.querySelector('.article-title');
    if (titleEl) titleEl.textContent = post.title;

    const tagEl = document.querySelector('.article-tag');
    if (tagEl) tagEl.textContent = post.category_badge || 'CNC Engineering';

    const dateEl = document.querySelector('.article-date');
    if (dateEl) dateEl.textContent = formatDate(post.published_date || post.created_at);

    const timeEl = document.querySelector('.article-reading-time');
    if (timeEl) timeEl.textContent = post.reading_time || '5 min read';

    const heroWrap = document.querySelector('.article-hero-wrap');
    if (heroWrap && post.cover_image) {
      heroWrap.innerHTML = `
        <img 
          src="${post.cover_image}" 
          alt="${post.title}" 
          style="width: 100%; height: 100%; object-fit: cover;"
          onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80';"
        />
      `;
    }

    // Populate multi-paragraph HTML or text
    if (proseElem && post.content) {
      // If content contains HTML tags, render directly; otherwise wrap in paragraphs
      if (post.content.includes('<p>') || post.content.includes('<div>')) {
        proseElem.innerHTML = post.content;
      } else {
        const paragraphs = post.content
          .split('\n\n')
          .filter(Boolean)
          .map((p) => `<p>${p.replace(/\n/g, '<br />')}</p>`)
          .join('');
        proseElem.innerHTML = paragraphs;
      }
    }

    console.log(`Rendered dynamic article: "${post.title}"`);
  } catch (err) {
    console.error('Error loading article detail:', err);
  }
}

// Auto-run on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadBlogGrid();
      loadArticleDetail();
    });
  } else {
    loadBlogGrid();
    loadArticleDetail();
  }
}

export default { loadBlogGrid, loadArticleDetail };
