import { useEffect, useState } from 'react';

const MY_LIST_KEY = 'wif_my_list';

const MAX_MY_LIST_ITEMS = 100;

function normalizeListItem(item) {
  return {
    id: item?.id,
    title: item?.title || item?.name || '',
    poster_path: item?.poster_path || '',
    release_date: item?.release_date || item?.first_air_date || '',
    vote_average: item?.vote_average || 0,
    media_type: item?.media_type || 'movie',
    addedAt: item?.addedAt || Date.now(),
  };
}

function normalizeStoredList(value) {
  if (!Array.isArray(value)) return [];
  const normalized = value
    .map(normalizeListItem)
    .filter(item => item.id != null)
    .slice(0, MAX_MY_LIST_ITEMS);

  const ids = new Set();
  return normalized.filter(item => {
    if (ids.has(String(item.id))) return false;
    ids.add(String(item.id));
    return true;
  });
}

function getStoredList() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(MY_LIST_KEY) || '[]');
    return normalizeStoredList(parsed);
  } catch {
    return [];
  }
}

function isQuotaExceeded(error) {
  return error instanceof DOMException && (
    error.code === 22 ||
    error.code === 1014 ||
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
  );
}

function saveStoredList(list) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const compactList = normalizeStoredList(list);
  try {
    localStorage.setItem(MY_LIST_KEY, JSON.stringify(compactList));
    notifyMyListUpdated();
  } catch (error) {
    if (isQuotaExceeded(error)) {
      console.warn('My list storage quota exceeded. Trimming saved items.');
      const trimmed = compactList.slice(0, Math.min(compactList.length, MAX_MY_LIST_ITEMS));
      try {
        localStorage.setItem(MY_LIST_KEY, JSON.stringify(trimmed));
        notifyMyListUpdated();
      } catch (innerError) {
        console.error('Failed to save my list after trimming. Clearing saved list.', innerError);
        localStorage.removeItem(MY_LIST_KEY);
        notifyMyListUpdated();
      }
    } else {
      console.error('Failed to save my list:', error);
    }
  }
}

function notifyMyListUpdated() {
  if (typeof window !== 'undefined' && window?.dispatchEvent) {
    window.dispatchEvent(new Event('wif_my_list_updated'));
  }
}

export function getMyList() {
  return getStoredList();
}

export function isInMyList(id) {
  return getStoredList().some(movie => String(movie.id) === String(id));
}

function createListItem(movie) {
  return {
    id: movie.id,
    title: movie.title || movie.name || '',
    poster_path: movie.poster_path || '',
    release_date: movie.release_date || movie.first_air_date || '',
    vote_average: movie.vote_average || 0,
    media_type: movie.media_type || 'movie',
    addedAt: Date.now(),
  };
}

export function addToMyList(movie) {
  const list = getStoredList();
  const exists = list.some(item => String(item.id) === String(movie.id));
  if (exists) return list;
  const nextList = [createListItem(movie), ...list];
  saveStoredList(nextList);
  return nextList;
}

export function removeFromMyList(id) {
  const nextList = getStoredList().filter(item => String(item.id) !== String(id));
  saveStoredList(nextList);
  return nextList;
}

export function toggleMyList(movie) {
  if (isInMyList(movie.id)) {
    removeFromMyList(movie.id);
    return false;
  }

  addToMyList(movie);
  return true;
}

export function useMyListState() {
  const [list, setList] = useState(() => getStoredList());

  useEffect(() => {
    const handleUpdate = () => setList(getStoredList());
    window.addEventListener('wif_my_list_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('wif_my_list_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return [list, setList];
}

// ── Continue Watching ─────────────────────────────────────────────────────────
export function getContinueWatching() {
  try {
    return JSON.parse(localStorage.getItem('wif_continue_watching') || '[]');
  } catch {
    return [];
  }
}

export function addToContinueWatching(movie) {
  const list = getContinueWatching().filter(m => String(m.id) !== String(movie.id));
  const item = {
    id: movie.id,
    title: movie.title || movie.name || '',
    poster_path: movie.poster_path || '',
    release_date: movie.release_date || '',
    vote_average: movie.vote_average || 0,
    media_type: movie.media_type || 'movie',
    imdb_id: movie.imdb_id || '',
    watchedAt: Date.now(),
  };
  localStorage.setItem('wif_continue_watching', JSON.stringify([item, ...list].slice(0, 10)));
}

export function removeFromContinueWatching(id) {
  const list = getContinueWatching().filter(m => String(m.id) !== String(id));
  localStorage.setItem('wif_continue_watching', JSON.stringify(list));
}
