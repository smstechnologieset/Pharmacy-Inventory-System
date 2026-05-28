/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getSystemSettings } from "../services/firestoreService";
import { translations, getNestedTranslation } from "../data/translations";

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [globalSettings, setGlobalSettings] = useState({
    currency: "ETB",
    lowStockThreshold: 10,
    expiryWarningDays: 60,
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("appLanguage") || "en";
  });

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const settings = await getSystemSettings();
        setGlobalSettings(settings);
      } catch (err) {
        console.error("Failed to fetch global settings:", err);
      }
    };
    fetchGlobalSettings();
  }, []);

  const updateLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("appLanguage", lang);
  };

  const t = useCallback((key) => {
    const langDict = translations[language] || translations.en;
    const translation = getNestedTranslation(langDict, key);
    if (translation !== undefined) return translation;

    const englishFallback = getNestedTranslation(translations.en, key);
    return englishFallback !== undefined ? englishFallback : key;
  }, [language]);

  const value = {
    settings: { ...globalSettings, language },
    setGlobalSettings,
    updateLanguage,
    t,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
