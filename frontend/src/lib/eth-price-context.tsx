"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface EthPriceContextType {
  ethPrice: number;
  isLoading: boolean;
  lastUpdated: Date | null;
}

const EthPriceContext = createContext<EthPriceContextType>({
  ethPrice: 3000, // Default fallback
  isLoading: true,
  lastUpdated: null,
});

export function EthPriceProvider({ children }: { children: ReactNode }) {
  const [ethPrice, setEthPrice] = useState(3000);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchPrice() {
      try {
        const response = await fetch("/api/eth-price");
        const data = await response.json();
        setEthPrice(data.price);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to fetch ETH price:", error);
        // Keep default price on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrice();

    // Refresh price every hour
    const interval = setInterval(fetchPrice, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <EthPriceContext.Provider value={{ ethPrice, isLoading, lastUpdated }}>
      {children}
    </EthPriceContext.Provider>
  );
}

export function useEthPrice() {
  return useContext(EthPriceContext);
}
