import React, { createContext, useContext, useEffect, useState } from "react";
import { setAuthToken } from "../../api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const raw = localStorage.getItem("ph_auth");
      return raw ? JSON.parse(raw) : { token: null, user: null };
    } catch {
      return { token: null, user: null };
    }
  });

  useEffect(() => {
    localStorage.setItem("ph_auth", JSON.stringify(auth));
  }, [auth]);

  const login = (token, user) => {
    setAuthToken(token);
    setAuth({ token, user });
  };
  const logout = () => {
    setAuthToken(null);
    setAuth({ token: null, user: null });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}


export { AuthContext };
