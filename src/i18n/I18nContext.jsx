import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "./translations";

const I18nContext = createContext(null);
const STORAGE_KEY = "shiftguard-lang";

function getInitialLang() {
  const bootstrapped = document.documentElement.getAttribute("lang");
  if (bootstrapped === "de" || bootstrapped === "en") return bootstrapped;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "de" || stored === "en" ? stored : "en";
  } catch {
    return "en";
  }
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore persistence failures — language still applies for this session.
    }
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const value = useMemo(() => {
    const dict = translations[lang] || translations.en;
    const t = (key) => dict[key] || translations.en[key] || key;
    const toggleLang = () => setLang((current) => (current === "en" ? "de" : "en"));
    return { lang, setLang, toggleLang, t };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
