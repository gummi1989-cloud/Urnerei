export const DEFAULT_PLATFORM_PASSWORD = '';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, User } from 'firebase/auth';
import { auth } from '../firebase';

const TEAM_EMAIL = 'team@urnenwerkstatt.local';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  isDefaultPassword: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (passwordInput: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, TEAM_EMAIL, passwordInput.trim());
      return true;
    } catch (e) {
      console.error('Firebase Login fehlgeschlagen:', e);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Abmeldung fehlgeschlagen:', e);
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Nicht angemeldet.' };
    if (!newPassword.trim() || newPassword.trim().length < 6) {
      return { success: false, error: 'Das neue Passwort muss mindestens 6 Zeichen lang sein.' };
    }
    try {
      await signInWithEmailAndPassword(auth, TEAM_EMAIL, oldPassword.trim());
      await updatePassword(currentUser, newPassword.trim());
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Passwortänderung fehlgeschlagen.' };
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-100 text-stone-600 font-sans">Authentifizierung wird geprüft...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!currentUser, login, logout, changePassword, isDefaultPassword: false }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
