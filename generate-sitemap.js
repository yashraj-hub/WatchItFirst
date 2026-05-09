// generate-sitemap.js — run via: node generate-sitemap.js
// Fetches popular/trending movies from TMDB and writes public/sitemap.xml

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = process.env.VITE_TMDB_API_KEY || '629e262b0af2003da188a36ae2cc6580';
const BASE_URL = 'https://api.themoviedb.org/3';
const SITE_URL = 'https://watchitfirst.onrender.com';

async function fetchJSON(url) {
  const res = await fetch(url);
  return res.json();
}

async function getMovieIds() {
  const ids = new Set();

  const endpoints = [
    `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`,
    `${BASE_URL}/movie/popular?api_key=${API_KEY}`,
    `${BASE_URL}/movie/top_rated?api_key=${API_KEY}`,
    `${BASE_URL}/movie/now_playing?api_key=${API_KEY}`,
    `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&page=2`,
    `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=2`,
    // Bollywood
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=hi&sort_by=popularity.desc`,
    // Animation
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=16&sort_by=popularity.desc`,
  ];

  const results = await Promise.all(endpoints.map(fetchJSON));
  results.forEach(data => {
    (data.results || []).forEach(m => ids.add(m.id));
  });

  return [...ids];
}

function buildSitemap(movieIds) {
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/bollywood', priority: '0.9', changefreq: 'daily' },
    { url: '/animation', priority: '0.9', changefreq: 'daily' },
    { url: '/movies', priority: '0.8', changefreq: 'daily' },
    { url: '/recommendations', priority: '0.8', changefreq: 'weekly' },
    { url: '/search', priority: '0.7', changefreq: 'weekly' },
    // Genre pages
    { url: '/movies?genreId=28&genreName=Action', priority: '0.7', changefreq: 'weekly' },
    { url: '/movies?genreId=35&genreName=Comedy', priority: '0.7', changefreq: 'weekly' },
    { url: '/movies?genreId=18&genreName=Drama', priority: '0.7', changefreq: 'weekly' },
    { url: '/movies?genreId=27&genreName=Horror', priority: '0.7', changefreq: 'weekly' },
    { url: '/movies?genreId=878&genreName=Science+Fiction', priority: '0.7', changefreq: 'weekly' },
    { url: '/movies?genreId=53&genreName=Thriller', priority: '0.7', changefreq: 'weekly' },
    { url: '/movies?genreId=12&genreName=Adventure', priority: '0.7', changefreq: 'weekly' },
    { url: '/movies?genreId=10749&genreName=Romance', priority: '0.7', changefreq: 'weekly' },
    // Studio pages
    { url: '/movies?genreId=420&genreName=Marvel+Studios&isStudio=true', priority: '0.8', changefreq: 'weekly' },
    { url: '/movies?genreId=429&genreName=DC+Studios&isStudio=true', priority: '0.8', changefreq: 'weekly' },
    { url: '/movies?genreId=174&genreName=Warner+Bros.&isStudio=true', priority: '0.7', changefreq: 'weekly' },
    { url: '/movies?genreId=33&genreName=Universal+Pictures&isStudio=true', priority: '0.7', changefreq: 'weekly' },
  ];

  const staticXml = staticPages.map(p => `
  <url>
    <loc>${SITE_URL}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

  const movieXml = movieIds.map(id => `
  <url>
    <loc>${SITE_URL}/details/${id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${movieXml}
</urlset>`;
}

async function main() {
  console.log('Fetching movie IDs from TMDB...');
  const movieIds = await getMovieIds();
  console.log(`Found ${movieIds.length} movies`);

  const xml = buildSitemap(movieIds);
  const outPath = path.join(__dirname, 'public', 'sitemap.xml');
  fs.writeFileSync(outPath, xml, 'utf-8');
  console.log(`Sitemap written to ${outPath} with ${movieIds.length} movie pages`);
}

main().catch(err => { console.error(err); process.exit(1); });
