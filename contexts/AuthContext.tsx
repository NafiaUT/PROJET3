
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService, GatewayError } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasScope: (scope: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Basic validation
        if (parsedUser && parsedUser.token && parsedUser.username) {
          return parsedUser;
        }
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  /**
   * Delegates credential verification to the virtual gateway and stores the session locally.
   * Gateway errors are rethrown with helpful explanations so the UI can render explicit messages.
   */
  const login = async (username: string, password: string) => {
    try {
      const loggedInUser = await apiService.login(username, password);
      setUser(loggedInUser);
    } catch (error) {
      const baseMessage =
        error instanceof GatewayError
          ? error.message
          : 'Unable to authenticate because the gateway returned an unknown error.';
      console.error('Login failed', error);
      throw new Error(baseMessage);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const hasScope = useCallback(
    (scope: string): boolean => {
      if (!user) return false;
      return user.scopes.includes(scope) || user.scopes.includes('admin');
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, login, logout, hasScope }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
