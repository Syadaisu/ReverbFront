// src/Context/StompProvider.tsx
import React, { ReactNode } from "react";
import { useStomp } from "../Hooks/useStomp";

export const StompContext = React.createContext<ReturnType<typeof useStomp> | null>(null);

interface StompProviderProps {
  children: ReactNode;
}

export const StompProvider: React.FC<StompProviderProps> = ({ children }) => {
  const stomp = useStomp();

  return <StompContext.Provider value={stomp}>{children}</StompContext.Provider>;
};
