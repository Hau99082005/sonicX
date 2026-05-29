import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthProfile } from '../api/auth';
import { getToken, getProfile, saveToken, saveProfile, clearAuth } from '../utils/storage';

interface AuthContextType {
  profile: AuthProfile | null;
  token: string | null;
  isLoading: boolean;
  updateAuth: (token: string, profile: AuthProfile) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const [storedToken, storedProfile] = await Promise.all([
          getToken(),
          getProfile(),
        ]);
        if (storedToken && storedProfile) {
          setToken(storedToken);
          setProfile(storedProfile);
        }
      } catch (e) {
        console.error('Failed to load auth data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  const updateAuth = async (newToken: string, newProfile: AuthProfile) => {
    await Promise.all([saveToken(newToken), saveProfile(newProfile)]);
    setToken(newToken);
    setProfile(newProfile);
  };

  const signOut = async () => {
    await clearAuth();
    setToken(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ profile, token, isLoading, updateAuth, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
