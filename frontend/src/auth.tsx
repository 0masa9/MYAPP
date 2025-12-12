import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthResponse } from "./types";
import { apiClient } from "./api";

interface AuthContextProps {
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("book_memory_token");
    if (stored) {
      setToken(stored);
    }
  }, []);

  const handleAuth = async (path: string, username: string, password: string) => {
    const res = await apiClient<AuthResponse>(path, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(res.access_token);
    localStorage.setItem("book_memory_token", res.access_token);
  };

  const login = (username: string, password: string) => handleAuth("/api/auth/login", username, password);
  const signup = (username: string, password: string) => handleAuth("/api/auth/signup", username, password);

  const logout = () => {
    setToken(null);
    localStorage.removeItem("book_memory_token");
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
