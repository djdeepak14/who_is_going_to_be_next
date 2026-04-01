"use client";
import { createContext, useContext, useSyncExternalStore, ReactNode } from "react";

type Language = "En" | "Np";
interface LanguageContextType { lang: Language; toggleLanguage: () => void; }

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_KEY = "vanguard_lang";
const LANG_EVENT = "vanguard_lang_change";

const normalizeLang = (value: string | null): Language =>
  value === "En" || value === "Np" ? value : "Np";

const getLangSnapshot = (): Language => {
  if (typeof window === "undefined") return "Np";
  return normalizeLang(window.localStorage.getItem(LANG_KEY));
};

const subscribeLang = (onStoreChange: () => void) => {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== LANG_KEY) return;
    onStoreChange();
  };

  const onManualChange = () => onStoreChange();

  window.addEventListener("storage", onStorage);
  window.addEventListener(LANG_EVENT, onManualChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(LANG_EVENT, onManualChange);
  };
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore<Language>(subscribeLang, getLangSnapshot, () => "Np");

  const toggleLanguage = () => {
    const next = lang === "En" ? "Np" : "En";
    window.localStorage.setItem(LANG_KEY, next);
    window.dispatchEvent(new Event(LANG_EVENT));
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};