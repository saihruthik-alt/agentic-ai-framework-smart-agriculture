"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getCookie, setCookie, eraseCookie } from "../utils/cookies";

export interface UserSession {
  userId: string;
  username: string;
  email: string;
  role: string;
  token: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Restore session on client load
    const savedToken = getCookie("token");
    const savedUser = localStorage.getItem("user_profile");

    if (savedToken && savedUser) {
      try {
        const parsedProfile = JSON.parse(savedUser);
        setUser({
          ...parsedProfile,
          token: savedToken
        });
      } catch (e) {
        // Corrupted profile data, clean up
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      let response;
      try {
        response = await fetch("http://localhost:8080/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
      } catch (err) {
        throw new Error("Could not connect to the backend authentication server. Please ensure that your Spring Boot service is active on port 8080.");
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      const session: UserSession = {
        userId: data.userId,
        username: data.username,
        email: data.email,
        role: data.role,
        token: data.token
      };

      setCookie("token", data.token, 7);
      localStorage.setItem("user_profile", JSON.stringify({
        userId: data.userId,
        username: data.username,
        email: data.email,
        role: data.role
      }));

      setUser(session);
      router.push("/");
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string, role: string) => {
    setLoading(true);
    try {
      let response;
      try {
        response = await fetch("http://localhost:8080/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password, role })
        });
      } catch (err) {
        throw new Error("Could not connect to the backend authentication server. Please ensure that your Spring Boot service is active on port 8080.");
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      const session: UserSession = {
        userId: data.userId,
        username: data.username,
        email: data.email,
        role: data.role,
        token: data.token
      };

      setCookie("token", data.token, 7);
      localStorage.setItem("user_profile", JSON.stringify({
        userId: data.userId,
        username: data.username,
        email: data.email,
        role: data.role
      }));

      setUser(session);
      router.push("/");
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    eraseCookie("token");
    localStorage.removeItem("user_profile");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
