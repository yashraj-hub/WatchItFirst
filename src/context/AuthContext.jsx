import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, signOutUser, loginWithGoogle, ADMIN_EMAIL } from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u || null));
    return unsub;
  }, []);

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ user, isAdmin, signOut: signOutUser, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
