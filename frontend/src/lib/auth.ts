import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { useCallback, useState, useEffect, useRef } from "react";
import api, { type AuthHeaders } from "./api";

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Track previous address to detect wallet switches
  const prevAddressRef = useRef<string | undefined>(undefined);

  // Check/restore auth state when address changes
  useEffect(() => {
    // Detect wallet switch
    if (prevAddressRef.current && prevAddressRef.current !== address) {
      // Clear old auth state when switching wallets
      console.log("Wallet switched, clearing auth state");
      setIsAuthenticated(false);
      api.setAuth(null);
    }
    prevAddressRef.current = address;

    if (!address) {
      setIsAuthenticated(false);
      api.setAuth(null);
      return;
    }

    // Try to restore auth from storage
    const stored = sessionStorage.getItem(`moltgig_auth_${address}`);
    if (stored) {
      try {
        const auth = JSON.parse(stored) as AuthHeaders & { expires: number };
        if (auth.expires > Date.now()) {
          api.setAuth({
            "x-wallet-address": auth["x-wallet-address"],
            "x-signature": auth["x-signature"],
            "x-timestamp": auth["x-timestamp"],
          });
          setIsAuthenticated(true);
          return;
        } else {
          // Expired - clean up
          sessionStorage.removeItem(`moltgig_auth_${address}`);
        }
      } catch {
        // Invalid stored data - clean up
        sessionStorage.removeItem(`moltgig_auth_${address}`);
      }
    }
    setIsAuthenticated(false);
    api.setAuth(null);
  }, [address]);

  const authenticate = useCallback(async () => {
    if (!address || !isConnected) {
      throw new Error("Wallet not connected");
    }

    setIsAuthenticating(true);
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const message = `MoltGig Auth: ${timestamp}`;
      
      const signature = await signMessageAsync({ message });

      const authHeaders: AuthHeaders = {
        "x-wallet-address": address,
        "x-signature": signature,
        "x-timestamp": timestamp,
      };

      api.setAuth(authHeaders);

      // Store auth for 4 minutes (server allows 5)
      sessionStorage.setItem(
        `moltgig_auth_${address}`,
        JSON.stringify({
          ...authHeaders,
          expires: Date.now() + 4 * 60 * 1000,
        })
      );

      setIsAuthenticated(true);
      return authHeaders;
    } catch (err) {
      // User rejected or error occurred
      console.error("Authentication failed:", err);
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, isConnected, signMessageAsync]);

  const logout = useCallback(() => {
    if (address) {
      sessionStorage.removeItem(`moltgig_auth_${address}`);
    }
    api.setAuth(null);
    setIsAuthenticated(false);
  }, [address]);

  const fullLogout = useCallback(() => {
    logout();
    disconnect();
  }, [logout, disconnect]);

  return {
    isAuthenticated,
    isAuthenticating,
    authenticate,
    logout,
    fullLogout,
    address,
    isConnected,
  };
}

export function useAuthenticatedAction() {
  const { isAuthenticated, authenticate, isAuthenticating } = useAuth();

  const withAuth = useCallback(
    async <T>(action: () => Promise<T>): Promise<T> => {
      if (!isAuthenticated) {
        await authenticate();
      }
      return action();
    },
    [isAuthenticated, authenticate]
  );

  return { withAuth, isAuthenticating };
}
