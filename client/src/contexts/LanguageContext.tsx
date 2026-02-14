import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Language = "en" | "ta" | "hi" | "te" | "kn";

export const languageNames: Record<Language, string> = {
  en: "English",
  ta: "தமிழ்",
  hi: "हिन्दी",
  te: "తెలుగు",
  kn: "ಕನ್ನಡ",
};

export const languageLabels: Record<Language, string> = {
  en: "English",
  ta: "Tamil",
  hi: "Hindi",
  te: "Telugu",
  kn: "Kannada",
};

// Flat translation keys
type TranslationKeys = typeof import("../i18n/en").default;
export type TKey = keyof TranslationKeys;

const translations: Record<Language, () => Promise<{ default: Record<string, string> }>> = {
  en: () => import("../i18n/en"),
  ta: () => import("../i18n/ta"),
  hi: () => import("../i18n/hi"),
  te: () => import("../i18n/te"),
  kn: () => import("../i18n/kn"),
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoaded: boolean;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "workshop-lang";

function getInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in languageNames) return saved as Language;
  } catch {}
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [loadedTranslations, setLoadedTranslations] = useState<Record<string, Record<string, string>>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load English as fallback + current language on mount
  useState(() => {
    const loadInitial = async () => {
      const enMod = await translations.en();
      const loaded: Record<string, Record<string, string>> = { en: enMod.default };
      if (language !== "en") {
        const langMod = await translations[language]();
        loaded[language] = langMod.default;
      }
      setLoadedTranslations(loaded);
      setIsLoaded(true);
    };
    loadInitial();
  });

  const setLanguage = useCallback(async (lang: Language) => {
    if (!loadedTranslations[lang]) {
      const mod = await translations[lang]();
      setLoadedTranslations((prev) => ({ ...prev, [lang]: mod.default }));
    }
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }, [loadedTranslations]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let text =
        loadedTranslations[language]?.[key] ??
        loadedTranslations["en"]?.[key] ??
        key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        });
      }
      return text;
    },
    [language, loadedTranslations]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider");
  return ctx;
}
