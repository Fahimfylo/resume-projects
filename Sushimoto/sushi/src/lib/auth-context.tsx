"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "./api-client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isProfileComplete: boolean;
}

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<{ accessToken: string }>;
  register: (input: RegisterInput) => Promise<{ accessToken: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  completeProfile: (data: {
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      label?: string;
    };
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<AuthUser>("/auth/me");
      if (res.success && res.data) {
        setUser(res.data);
        api.setAccessToken(
          typeof window !== "undefined"
            ? sessionStorage.getItem("accessToken")
            : null
        );
      } else {
        setUser(null);
        api.setAccessToken(null);
      }
    } catch {
      setUser(null);
      api.setAccessToken(null);
    }
  }, []);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("accessToken")
        : null;
    if (token) {
      api.setAccessToken(token);
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (input: LoginInput) => {
    const res = await api.post<{
      user: AuthUser;
      accessToken: string;
    }>("/auth/login", input, { skipAuth: true });

    if (!res.success || !res.data) {
      throw new Error(res.message || "Login failed");
    }

    const { user: userData, accessToken } = res.data;
    api.setAccessToken(accessToken);
    sessionStorage.setItem("accessToken", accessToken);
    setUser(userData);
    return { accessToken };
  };

  const register = async (input: RegisterInput) => {
    const res = await api.post<{
      user: AuthUser;
      accessToken: string;
    }>("/auth/register", input, { skipAuth: true });

    if (!res.success || !res.data) {
      throw new Error(res.message || "Registration failed");
    }

    const { user: userData, accessToken } = res.data;
    api.setAccessToken(accessToken);
    sessionStorage.setItem("accessToken", accessToken);
    setUser(userData);
    return { accessToken };
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // proceed even if API call fails
    }
    api.setAccessToken(null);
    sessionStorage.removeItem("accessToken");
    setUser(null);
  };

  const completeProfile = async (data: {
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      label?: string;
    };
  }) => {
    const res = await api.post<AuthUser>("/users/complete-profile", data as any);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to complete profile");
    }
    setUser(res.data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        completeProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
