export type CurrencyCode = string;

export type Currency = {
  code: CurrencyCode;
  name: string;
  flag: string;
  locale: string;
  decimals: 0 | 2;
};

export type Rates = Record<string, number>;

export const POPULAR_CURRENCY_CODES: CurrencyCode[] = [
  "EUR",
  "GBP",
  "USD",
  "BRL",
  "JPY",
  "CAD",
  "AUD",
];

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: "EUR", name: "Euro",                flag: "🇪🇺", locale: "de-DE", decimals: 2 },
  { code: "GBP", name: "British Pound",       flag: "🇬🇧", locale: "en-GB", decimals: 2 },
  { code: "USD", name: "US Dollar",           flag: "🇺🇸", locale: "en-US", decimals: 2 },
  { code: "BRL", name: "Brazilian Real",      flag: "🇧🇷", locale: "pt-BR", decimals: 2 },
  { code: "JPY", name: "Japanese Yen",        flag: "🇯🇵", locale: "ja-JP", decimals: 0 },
  { code: "CAD", name: "Canadian Dollar",     flag: "🇨🇦", locale: "en-CA", decimals: 2 },
  { code: "AUD", name: "Australian Dollar",   flag: "🇦🇺", locale: "en-AU", decimals: 2 },
  { code: "CHF", name: "Swiss Franc",         flag: "🇨🇭", locale: "de-CH", decimals: 2 },
  { code: "SEK", name: "Swedish Krona",       flag: "🇸🇪", locale: "sv-SE", decimals: 2 },
  { code: "NOK", name: "Norwegian Krone",     flag: "🇳🇴", locale: "nb-NO", decimals: 2 },
  { code: "DKK", name: "Danish Krone",        flag: "🇩🇰", locale: "da-DK", decimals: 2 },
  { code: "PLN", name: "Polish Złoty",        flag: "🇵🇱", locale: "pl-PL", decimals: 2 },
  { code: "CZK", name: "Czech Koruna",        flag: "🇨🇿", locale: "cs-CZ", decimals: 2 },
  { code: "HUF", name: "Hungarian Forint",    flag: "🇭🇺", locale: "hu-HU", decimals: 2 },
  { code: "RON", name: "Romanian Leu",        flag: "🇷🇴", locale: "ro-RO", decimals: 2 },
  { code: "BGN", name: "Bulgarian Lev",       flag: "🇧🇬", locale: "bg-BG", decimals: 2 },
  { code: "HRK", name: "Croatian Kuna",       flag: "🇭🇷", locale: "hr-HR", decimals: 2 },
  { code: "MXN", name: "Mexican Peso",        flag: "🇲🇽", locale: "es-MX", decimals: 2 },
  { code: "ARS", name: "Argentine Peso",      flag: "🇦🇷", locale: "es-AR", decimals: 2 },
  { code: "CLP", name: "Chilean Peso",        flag: "🇨🇱", locale: "es-CL", decimals: 0 },
  { code: "COP", name: "Colombian Peso",      flag: "🇨🇴", locale: "es-CO", decimals: 2 },
  { code: "PEN", name: "Peruvian Sol",        flag: "🇵🇪", locale: "es-PE", decimals: 2 },
  { code: "INR", name: "Indian Rupee",        flag: "🇮🇳", locale: "en-IN", decimals: 2 },
  { code: "CNY", name: "Chinese Yuan",        flag: "🇨🇳", locale: "zh-CN", decimals: 2 },
  { code: "KRW", name: "South Korean Won",    flag: "🇰🇷", locale: "ko-KR", decimals: 0 },
  { code: "SGD", name: "Singapore Dollar",    flag: "🇸🇬", locale: "en-SG", decimals: 2 },
  { code: "HKD", name: "Hong Kong Dollar",    flag: "🇭🇰", locale: "zh-HK", decimals: 2 },
  { code: "THB", name: "Thai Baht",           flag: "🇹🇭", locale: "th-TH", decimals: 2 },
  { code: "MYR", name: "Malaysian Ringgit",   flag: "🇲🇾", locale: "ms-MY", decimals: 2 },
  { code: "IDR", name: "Indonesian Rupiah",   flag: "🇮🇩", locale: "id-ID", decimals: 0 },
  { code: "PHP", name: "Philippine Peso",     flag: "🇵🇭", locale: "fil-PH", decimals: 2 },
  { code: "VND", name: "Vietnamese Đồng",     flag: "🇻🇳", locale: "vi-VN", decimals: 0 },
  { code: "AED", name: "UAE Dirham",          flag: "🇦🇪", locale: "ar-AE", decimals: 2 },
  { code: "SAR", name: "Saudi Riyal",         flag: "🇸🇦", locale: "ar-SA", decimals: 2 },
  { code: "ZAR", name: "South African Rand",  flag: "🇿🇦", locale: "en-ZA", decimals: 2 },
  { code: "NGN", name: "Nigerian Naira",      flag: "🇳🇬", locale: "en-NG", decimals: 2 },
  { code: "KES", name: "Kenyan Shilling",     flag: "🇰🇪", locale: "sw-KE", decimals: 2 },
  { code: "GHS", name: "Ghanaian Cedi",       flag: "🇬🇭", locale: "en-GH", decimals: 2 },
];

export const FALLBACK_RATES: Rates = {
  EUR: 1,
  GBP: 0.86,
  USD: 1.08,
  BRL: 5.90,
  JPY: 160,
  CAD: 1.47,
  AUD: 1.66,
  CHF: 0.96,
  SEK: 11.25,
  NOK: 11.80,
  DKK: 7.46,
  PLN: 4.26,
  CZK: 25.10,
  HUF: 402,
  RON: 4.98,
  BGN: 1.96,
  HRK: 7.53,
  MXN: 20.60,
  ARS: 1080,
  CLP: 980,
  COP: 4250,
  PEN: 3.98,
  INR: 89,
  CNY: 7.65,
  KRW: 1450,
  SGD: 1.44,
  HKD: 8.40,
  THB: 37.50,
  MYR: 4.85,
  IDR: 17200,
  PHP: 61,
  VND: 26800,
  AED: 3.97,
  SAR: 4.05,
  ZAR: 19.80,
  NGN: 1680,
  KES: 139,
  GHS: 16.80,
};

const CACHE_KEY = "pa_exchange_rates";
const CACHE_TS_KEY = "pa_exchange_rates_ts";
const CACHE_TTL_MS = 60 * 60 * 1000;

export async function fetchRates(): Promise<Rates> {
  if (typeof window !== "undefined") {
    const ts = localStorage.getItem(CACHE_TS_KEY);
    const cached = localStorage.getItem(CACHE_KEY);
    if (ts && cached && Date.now() - Number(ts) < CACHE_TTL_MS) {
      try {
        return JSON.parse(cached) as Rates;
      } catch {
        // ignore parse errors, fall through to fetch
      }
    }
  }

  const apiKey = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;
  if (!apiKey) return fetchAdminFallbackRates();

  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/EUR`,
      { cache: "no-store" },
    );
    const data = await res.json();
    if (data.result !== "success") return fetchAdminFallbackRates();

    const rates = data.conversion_rates as Rates;

    if (typeof window !== "undefined") {
      localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
      localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
    }

    return rates;
  } catch {
    return fetchAdminFallbackRates();
  }
}

async function fetchAdminFallbackRates(): Promise<Rates> {
  try {
    const res = await fetch("/api/currency-fallback");
    if (res.ok) return (await res.json()) as Rates;
  } catch {
    // ignore
  }
  return FALLBACK_RATES;
}

export function getCurrency(code: CurrencyCode): Currency {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code) ?? SUPPORTED_CURRENCIES[0];
}

export function convertPrice(
  eurCents: number,
  currency: Currency,
  rates: Rates,
): number {
  const rate = rates[currency.code] ?? FALLBACK_RATES[currency.code] ?? 1;
  const converted = (eurCents / 100) * rate;
  return currency.decimals === 0 ? Math.round(converted) : converted;
}

export function formatPrice(
  eurCents: number,
  currency: Currency,
  rates: Rates,
): string {
  const amount = convertPrice(eurCents, currency, rates);
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(amount);
}

export function formatEurBaseline(eurCents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(eurCents / 100);
}

export function formatAmountForPayPal(amount: number, decimals: 0 | 2): string {
  return decimals === 0 ? String(Math.round(amount)) : amount.toFixed(2);
}
