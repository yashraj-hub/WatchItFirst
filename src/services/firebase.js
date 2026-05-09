import { initializeApp } from 'firebase/app';
import {
  getAuth, signInAnonymously, signInWithPopup, GoogleAuthProvider,
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail,
} from 'firebase/auth';
import {
  getFirestore, doc, setDoc, getDoc, deleteDoc,
  collection, getDocs, serverTimestamp, query, orderBy, limit, writeBatch,
} from 'firebase/firestore';

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

export const ADMIN_EMAIL = 'yashrajnayak08@gmail.com';

// ── Browser Info ──────────────────────────────────────────────────────────────
export function collectBrowserInfo() {
  const ua = navigator.userAgent;
  const getBrowser = () => {
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('OPR') || ua.includes('Opera')) return 'Opera';
    return 'Unknown';
  };
  const getOS = () => {
    if (ua.includes('Windows NT 10')) return 'Windows 10/11';
    if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac OS X')) return 'macOS';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    if (ua.includes('Linux')) return 'Linux';
    return 'Unknown';
  };
  const getDevice = () => {
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) return 'Mobile';
    if (/Tablet|iPad/i.test(ua)) return 'Tablet';
    return 'Desktop';
  };

  return {
    browser: getBrowser(),
    os: getOS(),
    device: getDevice(),
    language: navigator.language || 'Unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
    screenResolution: `${screen.width}x${screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    colorDepth: `${screen.colorDepth}-bit`,
    cookiesEnabled: navigator.cookieEnabled,
    onlineStatus: navigator.onLine,
    platform: navigator.platform || 'Unknown',
    referrer: document.referrer || 'Direct',
    userAgent: ua,
    touchSupport: 'ontouchstart' in window,
    doNotTrack: navigator.doNotTrack === '1',
    hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
    deviceMemory: navigator.deviceMemory || 'Unknown',
    connectionType: navigator.connection?.effectiveType || 'Unknown',
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function registerWithEmail(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const browserInfo = collectBrowserInfo();
  await setDoc(doc(db, 'users', cred.user.uid, 'profile', 'data'), {
    uid: cred.user.uid,
    email,
    displayName: displayName || email.split('@')[0],
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
    consentGiven: true,
    consentAt: serverTimestamp(),
    browserInfo,
    moviesWatched: 0,
    provider: 'email',
  });
  return cred.user;
}

export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  // Update last seen + browser info
  await setDoc(doc(db, 'users', cred.user.uid, 'profile', 'data'), {
    lastSeen: serverTimestamp(),
    browserInfo: collectBrowserInfo(),
  }, { merge: true });
  return cred.user;
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  const profileRef = doc(db, 'users', cred.user.uid, 'profile', 'data');
  const snap = await getDoc(profileRef);
  if (!snap.exists()) {
    await setDoc(profileRef, {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName || cred.user.email,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      consentGiven: true,
      consentAt: serverTimestamp(),
      browserInfo: collectBrowserInfo(),
      moviesWatched: 0,
      provider: 'google',
    });
  } else {
    await setDoc(profileRef, { lastSeen: serverTimestamp(), browserInfo: collectBrowserInfo() }, { merge: true });
  }
  return cred.user;
}

export async function changePassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function signOutUser() {
  await auth.signOut();
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid, 'profile', 'data'));
  return snap.exists() ? snap.data() : null;
}

// ── My List ───────────────────────────────────────────────────────────────────
export async function saveToMyList(uid, movie) {
  await setDoc(doc(db, 'users', uid, 'myList', String(movie.id)), {
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
  await setDoc(doc(db, 'users', uid, 'continueWatching', String(movie.id)), {
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

// ── Watch History (max 100) ───────────────────────────────────────────────────
export async function addToWatchHistory(uid, movie) {
  const histRef = collection(db, 'users', uid, 'watchHistory');
  const snap = await getDocs(histRef);

  // If over 100, delete oldest
  if (snap.size >= 100) {
    const sorted = snap.docs.sort((a, b) =>
      (a.data().watchedAt?.seconds || 0) - (b.data().watchedAt?.seconds || 0)
    );
    const batch = writeBatch(db);
    sorted.slice(0, snap.size - 99).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  await setDoc(doc(db, 'users', uid, 'watchHistory', String(movie.id)), {
    id: movie.id,
    title: movie.title || movie.name || '',
    poster_path: movie.poster_path || '',
    release_date: movie.release_date || '',
    vote_average: movie.vote_average || 0,
    media_type: movie.media_type || 'movie',
    imdb_id: movie.imdb_id || '',
    watchedAt: serverTimestamp(),
  });

  // Increment counter
  await setDoc(doc(db, 'users', uid, 'profile', 'data'), {
    moviesWatched: (snap.size + 1),
    lastSeen: serverTimestamp(),
  }, { merge: true });
}

export async function getWatchHistory(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'watchHistory'));
  return snap.docs.map(d => d.data())
    .sort((a, b) => (b.watchedAt?.seconds || 0) - (a.watchedAt?.seconds || 0));
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export async function getAllUsers() {
  // Get all user profile docs
  const usersSnap = await getDocs(collection(db, 'users'));
  const users = [];
  for (const userDoc of usersSnap.docs) {
    const profileSnap = await getDoc(doc(db, 'users', userDoc.id, 'profile', 'data'));
    if (profileSnap.exists()) {
      const myListSnap = await getDocs(collection(db, 'users', userDoc.id, 'myList'));
      const historySnap = await getDocs(collection(db, 'users', userDoc.id, 'watchHistory'));
      users.push({
        ...profileSnap.data(),
        uid: userDoc.id,
        myListCount: myListSnap.size,
        watchHistoryCount: historySnap.size,
      });
    }
  }
  return users.sort((a, b) => (b.lastSeen?.seconds || 0) - (a.lastSeen?.seconds || 0));
}
