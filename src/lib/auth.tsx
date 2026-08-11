import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi, type TokenOut } from "@/lib/api";

interface Profile {
  email: string;
  name: string;
  picture: string;
}

interface AuthContextValue {
  token: string | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginDev: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem("kunphen_studio_profile");
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("kunphen_studio_token"),
  );
  const [profile, setProfile] = useState<Profile | null>(loadProfile);

  const applySession = useCallback((session: TokenOut) => {
    const nextProfile: Profile = {
      email: session.email,
      name: session.name,
      picture: session.picture,
    };
    localStorage.setItem("kunphen_studio_token", session.access_token);
    localStorage.setItem("kunphen_studio_profile", JSON.stringify(nextProfile));
    setToken(session.access_token);
    setProfile(nextProfile);
  }, []);

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      applySession(await authApi.loginWithGoogle(idToken));
    },
    [applySession],
  );

  const loginDev = useCallback(
    async (email: string) => {
      applySession(await authApi.loginDev(email));
    },
    [applySession],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("kunphen_studio_token");
    localStorage.removeItem("kunphen_studio_profile");
    setToken(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      profile,
      isAuthenticated: token !== null,
      loginWithGoogle,
      loginDev,
      logout,
    }),
    [token, profile, loginWithGoogle, loginDev, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
