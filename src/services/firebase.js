import { initializeApp } from 'firebase/app';
import {
  getAuth, signInWithPopup, GoogleAuthProvider,
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail,
} from 'firebase/auth';
import {
  getFirestore, doc, setDoc, getDoc, deleteDoc,
  collection, collectionGroup, getDocs, serverTimestamp, writeBatch, arrayUnion,
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

// ── Device fingerprint ───────────────────────────────────────────────────────
function getDeviceId() {
  let id = localStorage.getItem('wif_device_id');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('wif_device_id', id);
  }
  return id;
}

async function registerDevice(uid) {
  const deviceId = getDeviceId();
  const devicesRef = collection(db, 'users', uid, 'devices');
  const snap = await getDocs(devicesRef);

  // Check if this device already registered
  const existing = snap.docs.find(d => d.id === deviceId);
  if (existing) {
    // Update last seen
    await setDoc(doc(db, 'users', uid, 'devices', deviceId), {
      lastSeen: serverTimestamp(),
      browserInfo: collectBrowserInfo(),
    }, { merge: true });
    return { allowed: true, deviceCount: snap.size };
  }

  // New device — check limit
  if (snap.size >= 2) {
    return { allowed: false, deviceCount: snap.size };
  }

  // Register new device
  await setDoc(doc(db, 'users', uid, 'devices', deviceId), {
    deviceId,
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
    browserInfo: collectBrowserInfo(),
  });
  return { allowed: true, deviceCount: snap.size + 1 };
}

export async function getDevices(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'devices'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.lastSeen?.seconds || 0) - (a.lastSeen?.seconds || 0));
}

export async function revokeDevice(uid, deviceId) {
  await deleteDoc(doc(db, 'users', uid, 'devices', deviceId));
}

// ── Session revocation ────────────────────────────────────────────────────────
async function ensureUserFirestoreRecord(user, provider) {
  if (!user?.uid) return;

  const displayName =
    user.displayName ||
    user.email?.split('@')[0] ||
    'User';

  const rootRef = doc(db, 'users', user.uid);
  const profileRef = doc(db, 'users', user.uid, 'profile', 'data');
  const payload = {
    uid: user.uid,
    email: user.email || '',
    displayName,
    provider: provider || (user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email'),
    lastSeen: serverTimestamp(),
    browserInfo: collectBrowserInfo(),
  };

  await setDoc(rootRef, {
    ...payload,
    createdAt: serverTimestamp(),
  }, { merge: true });

  await setDoc(profileRef, {
    ...payload,
    consentGiven: true,
    consentAt: serverTimestamp(),
    moviesWatched: 0,
  }, { merge: true });
}
// ── Helper: register UID in admin index ───────────────────────────────────────
async function registerUidInIndex(uid) {
  try {
    await setDoc(doc(db, 'admin', 'userIndex'), { uids: arrayUnion(uid) }, { merge: true });
    console.log('registerUidInIndex - saved:', uid);
  } catch (e) {
    console.error('registerUidInIndex error:', e);
  }
}

async function registerUidsInIndex(uids) {
  const uniqueUids = Array.from(new Set((uids || []).filter(Boolean)));
  if (uniqueUids.length === 0) return;
  try {
    await setDoc(doc(db, 'admin', 'userIndex'), { uids: arrayUnion(...uniqueUids) }, { merge: true });
    console.log('registerUidsInIndex - saved:', uniqueUids.length);
  } catch (e) {
    console.error('registerUidsInIndex error:', e);
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function registerWithEmail(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserFirestoreRecord(
    { ...cred.user, displayName: displayName || email.split('@')[0] },
    'email'
  );
  await registerUidInIndex(cred.user.uid);
  return cred.user;
}

export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  
  // Check device limit
  const deviceCheck = await registerDevice(cred.user.uid);
  if (!deviceCheck.allowed) {
    await auth.signOut();
    throw new Error('Device limit reached. Max 2 devices allowed. Contact support to remove a device.');
  }

  await ensureUserFirestoreRecord(cred.user, 'email');
  return cred.user;
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureUserFirestoreRecord(cred.user, 'google');
  const profileRef = doc(db, 'users', cred.user.uid, 'profile', 'data');
  const snap = await getDoc(profileRef);
  if (!snap.exists()) {
    await registerUidInIndex(cred.user.uid);
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
  const [rootSnap, profileSnap] = await Promise.all([
    getDoc(doc(db, 'users', uid)),
    getDoc(doc(db, 'users', uid, 'profile', 'data')),
  ]);

  const rootData = rootSnap.exists() ? rootSnap.data() : {};
  const profileData = profileSnap.exists() ? profileSnap.data() : {};
  const merged = { uid, ...rootData, ...profileData };

  return Object.keys(merged).length > 1 ? merged : null;
}

export async function syncCurrentUserRecord(user) {
  if (!user) return;
  try {
    await ensureUserFirestoreRecord(user, user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email');
    await registerUidInIndex(user.uid);
  } catch (err) {
    console.error('syncCurrentUserRecord error:', err);
  }
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

  await setDoc(doc(db, 'users', uid, 'profile', 'data'), {
    moviesWatched: snap.size + 1,
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
  try {
    const [rootUsersSnap, profileSnaps, deviceSnaps, myListSnaps, historySnaps, continueSnaps, indexSnap] = await Promise.allSettled([
      getDocs(collection(db, 'users')),
      getDocs(collectionGroup(db, 'profile')),
      getDocs(collectionGroup(db, 'devices')),
      getDocs(collectionGroup(db, 'myList')),
      getDocs(collectionGroup(db, 'watchHistory')),
      getDocs(collectionGroup(db, 'continueWatching')),
      getDoc(doc(db, 'admin', 'userIndex')),
    ]);

    const usersByUid = new Map();
    const addUser = (uid, data = {}) => {
      if (!uid) return;
      usersByUid.set(uid, { ...(usersByUid.get(uid) || { uid }), ...data, uid });
    };

    if (rootUsersSnap.status === 'fulfilled') {
      rootUsersSnap.value.docs.forEach((snap) => {
        addUser(snap.id, snap.data());
      });
    }

    if (profileSnaps.status === 'fulfilled') {
      profileSnaps.value.docs.forEach((snap) => {
        const uid = snap.ref.parent.parent?.id;
        addUser(uid, snap.data());
      });
    }

    const mergeCollectionGroup = (snapSet) => {
      if (snapSet.status !== 'fulfilled') return;
      snapSet.value.docs.forEach((snap) => {
        const uid = snap.ref.parent.parent?.id;
        if (!uid) return;
        addUser(uid, {});
      });
    };

    mergeCollectionGroup(deviceSnaps);
    mergeCollectionGroup(myListSnaps);
    mergeCollectionGroup(historySnaps);
    mergeCollectionGroup(continueSnaps);

    const uids = indexSnap.status === 'fulfilled' && indexSnap.value.exists()
      ? (indexSnap.value.data().uids || [])
      : [];

    const missingUids = uids.filter(uid => !usersByUid.has(uid));
    if (missingUids.length > 0) {
      const missingUsers = await Promise.all(
        missingUids.map(async (uid) => {
          try {
            const [rootSnap, profileSnap] = await Promise.all([
              getDoc(doc(db, 'users', uid)),
              getDoc(doc(db, 'users', uid, 'profile', 'data')),
            ]);
            const rootData = rootSnap.exists() ? rootSnap.data() : {};
            const profileData = profileSnap.exists() ? profileSnap.data() : {};
            const merged = { uid, ...rootData, ...profileData };
            return Object.keys(merged).length > 1 ? merged : null;
          } catch {
            return null;
          }
        })
      );

      missingUsers.filter(Boolean).forEach((user) => {
        usersByUid.set(user.uid, user);
      });
    }

    const users = await Promise.all(
      Array.from(usersByUid.values()).map(async (user) => {
        try {
          const [devicesSnap, myListSnap, historySnap, continueSnap] = await Promise.all([
            getDocs(collection(db, 'users', user.uid, 'devices')),
            getDocs(collection(db, 'users', user.uid, 'myList')),
            getDocs(collection(db, 'users', user.uid, 'watchHistory')),
            getDocs(collection(db, 'users', user.uid, 'continueWatching')),
          ]);
          return {
            ...user,
            devices: devicesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            myList: myListSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            history: historySnap.docs.map(d => ({ id: d.id, ...d.data() })),
            continueWatching: continueSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            myListCount: myListSnap.size,
            watchHistoryCount: historySnap.size,
            deviceCount: devicesSnap.size,
            continueWatchingCount: continueSnap.size,
          };
        } catch {
          return {
            ...user,
            devices: user.devices || [],
            myList: user.myList || [],
            history: user.history || [],
            continueWatching: user.continueWatching || [],
            myListCount: user.myListCount || 0,
            watchHistoryCount: user.watchHistoryCount || 0,
            deviceCount: user.deviceCount || 0,
            continueWatchingCount: user.continueWatchingCount || 0,
          };
        }
      })
    );

    console.log('getAllUsers source counts', {
      rootUsers: rootUsersSnap.status === 'fulfilled' ? rootUsersSnap.value.size : 'blocked',
      profileGroup: profileSnaps.status === 'fulfilled' ? profileSnaps.value.size : 'blocked',
      devicesGroup: deviceSnaps.status === 'fulfilled' ? deviceSnaps.value.size : 'blocked',
      myListGroup: myListSnaps.status === 'fulfilled' ? myListSnaps.value.size : 'blocked',
      watchHistoryGroup: historySnaps.status === 'fulfilled' ? historySnaps.value.size : 'blocked',
      continueWatchingGroup: continueSnaps.status === 'fulfilled' ? continueSnaps.value.size : 'blocked',
      totalUsers: users.length,
    });

    await registerUidsInIndex(users.map(u => u.uid));

    return users.sort((a, b) => (b.lastSeen?.seconds || 0) - (a.lastSeen?.seconds || 0));
  } catch (err) {
    console.error('getAllUsers error:', err);
    return [];
  }
}
