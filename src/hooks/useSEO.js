import { useEffect } from 'react';

const BASE_URL = 'https://watchitfirst.onrender.com';
const DEFAULT = {
  title: 'WatchItFirst — Stream Movies & TV Shows',
  description: 'WatchItFirst is your ultimate destination to discover, explore and stream movies, TV shows, Bollywood hits and animated classics. Browse by franchise, genre, studio and more.',
  image: `${BASE_URL}/og-image.jpg`,
  url: BASE_URL,
};

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(data) {
  let el = document.querySelector('script[data-seo="jsonld"]');
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute('data-seo', 'jsonld');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function useSEO({ title, description, image, url, jsonLd } = {}) {
  useEffect(() => {
    const t = title ? `${title} | WatchItFirst` : DEFAULT.title;
    const d = description || DEFAULT.description;
    const img = image || DEFAULT.image;
    const u = url ? `${BASE_URL}${url}` : DEFAULT.url;

    document.title = t;

    // Basic
    setMeta('description', d);
    setMeta('robots', 'index, follow');

    // Open Graph
    setMeta('og:type', 'website', 'property');
    setMeta('og:site_name', 'WatchItFirst', 'property');
    setMeta('og:title', t, 'property');
    setMeta('og:description', d, 'property');
    setMeta('og:image', img, 'property');
    setMeta('og:url', u, 'property');

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', t);
    setMeta('twitter:description', d);
    setMeta('twitter:image', img);

    // Canonical
    setLink('canonical', u);

    // JSON-LD
    if (jsonLd) setJsonLd(jsonLd);
  }, [title, description, image, url, jsonLd]);
}
