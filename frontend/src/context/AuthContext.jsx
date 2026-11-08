
import React, {
  createContext,
  useState,
  useEffect,
  useCallback
} from 'react';

import { authService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  // Restore user from session storage
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });

  // Restore JWT token
  const [token, setToken] = useState(
    () => sessionStorage.getItem('token') || null
  );

  const [loading, setLoading] = useState(false);

  // Login function
  const login = async (
    username,
    password,
    captcha_id,
    captcha_code
  ) => {
    const res = await authService.login({
      username,
      password,
      captcha_id,
      captcha_code
    });

    if (!res?.success || !res?.token || !res?.user) {
      throw new Error(res?.message || 'Login failed.');
    }

    // Save token and user
    sessionStorage.setItem('token', res.token);
    sessionStorage.setItem('user', JSON.stringify(res.user));

    setToken(res.token);
    setUser(res.user);

    return res;
  };

  // Logout function
  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    setToken(null);
    setUser(null);

    window.location.href = '/login';
  }, []);

  // Verify existing session
  useEffect(() => {
    if (!token || user) {
      return;
    }

    let active = true;

    const verifyUser = async () => {
      try {
        setLoading(true);

        const res = await authService.getCurrentUser();

        if (!active) return;

        if (res?.success && res?.user) {
          sessionStorage.setItem(
            'user',
            JSON.stringify(res.user)
          );

          setUser(res.user);
        } else {
          logout();
        }

      } catch (error) {
        if (active) {
          console.error('Session verification failed:', error);
          logout();
        }

      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    verifyUser();

    return () => {
      active = false;
    };

  }, [token, user, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
