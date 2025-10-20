// src/localization/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as RNLocalize from "react-native-localize";

// Translations
const resources = {
  en: {
    translation: {
      welcome: "Welcome",
      login: "Login",
    },
  },
  ur: {
    translation: {
      welcome: "خوش آمدید",
      login: "لاگ ان",
    },
  },
};

// Detect device language
const fallback = { languageTag: "en", isRTL: false };
const { languageTag } =
  RNLocalize.findBestAvailableLanguage(Object.keys(resources)) || fallback;

i18n.use(initReactI18next).init({
  compatibilityJSON: "v3",
  lng: languageTag,
  fallbackLng: "en",
  resources,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
