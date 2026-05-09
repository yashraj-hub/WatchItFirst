import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, signOutUser, loginWithGoogle, ADMIN_EMAIL, syncCurrentUserRecord } from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      if (u) {
        syncCurrentUserRecord(u).catch(() => {});
        setUser(u);
      } else {
        setUser(null);
      }
    });
    return unsub;
  }, []);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const checkCanPlay = async () => {
    return !!user;
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, signOut: signOutUser, loginWithGoogle, checkCanPlay }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
