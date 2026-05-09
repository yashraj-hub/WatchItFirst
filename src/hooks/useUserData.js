const CW_KEY = 'wif_continue_watching';
const ML_KEY = 'wif_my_list';
const MAX_CW = 10;

function readJSON(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}
function writeJSON(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

const toId = (id) => Number(id);

// ── Continue Watching ─────────────────────────────────────────────────────────
export function addToContinueWatching(movie) {
  const list = readJSON(CW_KEY).filter(m => toId(m.id) !== toId(movie.id));
  list.unshift({ ...movie, id: toId(movie.id), watchedAt: Date.now() });
  writeJSON(CW_KEY, list.slice(0, MAX_CW));
}

export function getContinueWatching() {
  return readJSON(CW_KEY);
}

export function removeFromContinueWatching(id) {
  writeJSON(CW_KEY, readJSON(CW_KEY).filter(m => toId(m.id) !== toId(id)));
}

// ── My List ───────────────────────────────────────────────────────────────────
export function getMyList() {
  return readJSON(ML_KEY);
}

export function isInMyList(id) {
  return readJSON(ML_KEY).some(m => toId(m.id) === toId(id));
}

export function toggleMyList(movie) {
  const list = readJSON(ML_KEY);
  const numId = toId(movie.id);
  const exists = list.some(m => toId(m.id) === numId);
  if (exists) {
    writeJSON(ML_KEY, list.filter(m => toId(m.id) !== numId));
    return false;
  } else {
    writeJSON(ML_KEY, [{ ...movie, id: numId, addedAt: Date.now() }, ...list]);
    return true;
  }
}
