import { createContext, useContext, ReactNode } from "react";

const AuthContext = createContext({ user: { name: "Testuser" } });

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={{ user: { name: "Admin" } }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);