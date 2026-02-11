import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import {
  ApiUser,
  getStoredUser,
  getStoredTokens,
  apiLogin,
  apiRegister,
  apiLogout,
  clearAuth,
  RegisterBody,
} from "@/lib/api";

interface AuthContextType {
  user: ApiUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: RegisterBody) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.permission === "ADMIN";

  // Restore user from localStorage on mount
  useEffect(() => {
    const stored = getStoredUser();
    const { accessToken } = getStoredTokens();
    if (stored && accessToken) {
      setUser(stored);
    }
    setIsLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    if (result.success && result.data) {
      setUser(result.data.user);
      return { error: null };
    }
    return { error: result.message || "Bejelentkezés sikertelen" };
  }, []);

  const signUp = useCallback(async (data: RegisterBody) => {
    const result = await apiRegister(data);
    if (result.success && result.data) {
      setUser(result.data.user);
      return { error: null };
    }
    return { error: result.message || "Regisztráció sikertelen" };
  }, []);

  const signOut = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        signIn,
        signUp,
        signOut,
      }}
    >
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
