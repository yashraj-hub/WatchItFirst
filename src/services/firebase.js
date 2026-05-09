import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function signInAnon() {
  try {
    await signInAnonymously(auth);
  } catch (e) {
    console.error('Anon sign in failed:', e);
  }
}

export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (e) {
    console.error('Google sign in failed:', e);
  }
}

export async function signOut() {
  try {
    await auth.signOut();
  } catch (e) {
    console.error('Sign out failed:', e);
  }
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── My List ───────────────────────────────────────────────────────────────────
export async function saveToMyList(uid, movie) {
  const ref = doc(db, 'users', uid, 'myList', String(movie.id));
  await setDoc(ref, {
    id: movie.id,
    title: movie.title || movie.name || '',
    poster_path: movie.poster_path || '',
    release_date: movie.release_date || movie.first_air_date || '',
    vote_average: movie.vote_average || 0,
    media_type: movie.media_type || 'movie',
    addedAt: serverTimestamp(),
  });
}

export async function removeFromMyList(uid, movieId) {
  await deleteDoc(doc(db, 'users', uid, 'myList', String(movieId)));
}

export async function getMyList(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'myList'));
  return snap.docs.map(d => d.data()).sort((a, b) => (b.addedAt?.seconds || 0) - (a.addedAt?.seconds || 0));
}

export async function isInMyList(uid, movieId) {
  const snap = await getDoc(doc(db, 'users', uid, 'myList', String(movieId)));
  return snap.exists();
}

// ── Continue Watching ─────────────────────────────────────────────────────────
export async function saveContinueWatching(uid, movie) {
  const ref = doc(db, 'users', uid, 'continueWatching', String(movie.id));
  await setDoc(ref, {
    id: movie.id,
    title: movie.title || movie.name || '',
    poster_path: movie.poster_path || '',
    release_date: movie.release_date || '',
    vote_average: movie.vote_average || 0,
    media_type: movie.media_type || 'movie',
    imdb_id: movie.imdb_id || '',
    watchedAt: serverTimestamp(),
  });
}

export async function getContinueWatching(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'continueWatching'));
  return snap.docs.map(d => d.data())
    .sort((a, b) => (b.watchedAt?.seconds || 0) - (a.watchedAt?.seconds || 0))
    .slice(0, 10);
}

export async function removeFromContinueWatching(uid, movieId) {
  await deleteDoc(doc(db, 'users', uid, 'continueWatching', String(movieId)));
}
