// AuthProvider
import { createContext, useState, useEffect } from 'react';

interface AuthState {
  accessToken: string;
  userId: number;
  username: string;
  email: string;
  avatar: string;
}

const defaultAuthState: AuthState = {
  accessToken: "",
  userId: 0,
  username: "",
  email: "",
  avatar: ""
};

const AuthContext = createContext<{
  auth: AuthState;
  setAuth: React.Dispatch<React.SetStateAction<AuthState>>;
  logout: () => void;
}>({
  auth: defaultAuthState,
  setAuth: () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }: { children: any }) => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const stored = localStorage.getItem("auth");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse auth from localStorage:", e);
        return defaultAuthState;
      }
    }
    return defaultAuthState;
  });

  const logout = () => {
    setAuth(defaultAuthState);
    localStorage.removeItem("auth");
  };

  useEffect(() => {
    localStorage.setItem("auth", JSON.stringify(auth));
  }, [auth]);

  return (
    <AuthContext.Provider value={{ auth, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
