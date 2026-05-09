import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, signInAnon, signInWithGoogle, signOut } from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still loading

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      if (u) {
        setUser(u);
      } else {
        // Auto sign in anonymously so every visitor gets a uid
        await signInAnon();
      }
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
