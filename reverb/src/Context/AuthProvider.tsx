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
}>({
  auth: defaultAuthState,
  setAuth: () => {}
});

export const AuthProvider = ({ children }: any) => {
  const [auth, setAuth] = useState<AuthState>(defaultAuthState);

  // On initial mount, re-hydrate from localStorage if available
  useEffect(() => {
    const stored = localStorage.getItem("auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      // Optionally validate parsed object structure
      setAuth(parsed);
    }
  }, []);

  // Additionally, whenever `auth` changes, update localStorage
  useEffect(() => {
    localStorage.setItem("auth", JSON.stringify(auth));
  }, [auth]);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
