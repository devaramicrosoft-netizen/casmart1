import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);  // { id, name, email }
  const [isLoading, setIsLoading] = useState(true);  // true while checking stored token
  const [wishlistIds, setWishlistIds] = useState([]); // array of product ids

  const fetchWishlistIds = async (token) => {
    try {
      const res = await fetch(`${API}/api/wishlists`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setWishlistIds(data.wishlists.map(w => w.id)); // w.id is product.id because of JOIN SELECT p.*
      }
    } catch (e) { console.error('Failed to load wishlist'); }
  };

  // Auto-login from localStorage on app start 
  useEffect(() => {
    const token = localStorage.getItem('casmart_token');
    if (!token) { setIsLoading(false); return; }

    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          fetchWishlistIds(token);
        }
        else localStorage.removeItem('casmart_token'); // token expired
      })
      .catch(() => localStorage.removeItem('casmart_token'))
      .finally(() => setIsLoading(false));
  }, []);

  // Login 
  const login = useCallback(async (email, password) => {
    const res  = await fetch(`${API}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('casmart_token', data.token);
    setUser(data.user);
    fetchWishlistIds(data.token);
    return data.user;
  }, []);

  // Register 
  const register = useCallback(async (name, email, password) => {
    const res  = await fetch(`${API}/api/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('casmart_token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  // Logout 
  const logout = useCallback(() => {
    localStorage.removeItem('casmart_token');
    setUser(null);
    setWishlistIds([]);
  }, []);

  // updateUser — called after profile edit to sync state + token
  const updateUser = useCallback((newUser, newToken) => {
    if (newToken) localStorage.setItem('casmart_token', newToken);
    setUser(newUser);
  }, []);

  // getToken — for protected API calls 
  const getToken = useCallback(() => localStorage.getItem('casmart_token'), []);

  // toggleWishlist
  const toggleWishlist = useCallback(async (productId) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/wishlists/${productId}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlistIds(prev => 
          data.isWishlisted ? [...prev, productId] : prev.filter(id => id !== productId)
        );
      }
    } catch (e) { console.error('Failed to toggle wishlist'); }
  }, [getToken]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, getToken, updateUser, wishlistIds, toggleWishlist }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
