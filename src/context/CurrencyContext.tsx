"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  SUPPORTED_CURRENCIES,
  FALLBACK_RATES,
  fetchRates,
  convertPrice,
  formatPrice,
  getCurrency,
  type Currency,
  type Rates,
} from "@/lib/currency";

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rates: Rates;
  convert: (eurCents: number) => number;
  format: (eurCents: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const DEFAULT_CURRENCY = SUPPORTED_CURRENCIES[0]; // EUR
const LS_CURRENCY_KEY = "pa_currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);
  const [rates, setRates] = useState<Rates>(FALLBACK_RATES);

  useEffect(() => {
    const saved = localStorage.getItem(LS_CURRENCY_KEY);
    if (saved) {
      const found = getCurrency(saved);
      if (found) setCurrencyState(found);
    }
    fetchRates().then(setRates);
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(LS_CURRENCY_KEY, c.code);
  };

  const convert = (eurCents: number) => convertPrice(eurCents, currency, rates);
  const format = (eurCents: number) => formatPrice(eurCents, currency, rates);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
