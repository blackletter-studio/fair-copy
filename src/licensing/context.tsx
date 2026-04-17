import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { UNLICENSED_CONTEXT, type LicenseContext as LicenseContextType } from "./types";
import { verifyToken } from "./verify";
import { clearStoredToken, getStoredToken } from "./storage";

interface Ctx extends LicenseContextType {
  refresh: () => Promise<void>;
}

const defaultCtx: Ctx = { ...UNLICENSED_CONTEXT, refresh: async () => {} };
const InternalContext = createContext<Ctx>(defaultCtx);

export interface LicenseProviderProps {
  publicKeyPem: string;
  children: React.ReactNode;
}

export function LicenseProvider({
  publicKeyPem,
  children,
}: LicenseProviderProps): React.JSX.Element {
  const [state, setState] = useState<LicenseContextType>(UNLICENSED_CONTEXT);

  const refresh = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setState(UNLICENSED_CONTEXT);
      return;
    }
    const decoded = await verifyToken(token, publicKeyPem);
    if (!decoded) {
      clearStoredToken();
      setState(UNLICENSED_CONTEXT);
      return;
    }
    setState({
      licensed: true,
      role: decoded.role,
      features: decoded.features,
      email: decoded.email,
      expiresAt: new Date(decoded.exp * 1000),
    });
  }, [publicKeyPem]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <InternalContext.Provider value={{ ...state, refresh }}>{children}</InternalContext.Provider>
  );
}

export function useLicense(): Ctx {
  return useContext(InternalContext);
}
