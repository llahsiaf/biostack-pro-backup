// src/i18n/LanguageContext.tsx

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  DEFAULT_LANGUAGE,
  SupportedLanguage,
  getLanguage,
  setLanguage as setGlobalLanguage,
  t as translate,
  LANGUAGE_OPTIONS,
} from './translations';

export interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (
    key: string,
    variables?: Record<string, string | number>,
  ) => string;
  languages: typeof LANGUAGE_OPTIONS;
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage?: SupportedLanguage;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  initialLanguage,
}) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(
    initialLanguage || getLanguage() || DEFAULT_LANGUAGE,
  );

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initial = initialLanguage || getLanguage() || DEFAULT_LANGUAGE;
    setGlobalLanguage(initial);
    setLanguageState(initial);
    setIsReady(true);
  }, [initialLanguage]);

  const handleSetLanguage = useCallback(
    (nextLanguage: SupportedLanguage) => {
      if (nextLanguage === language) {
        return;
      }

      setGlobalLanguage(nextLanguage);
      setLanguageState(nextLanguage);
    },
    [language],
  );

  const t = useCallback(
    (
      key: string,
      variables?: Record<string, string | number>,
    ): string => {
      void language;
      return translate(key, variables);
    },
    [language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: handleSetLanguage,
      t,
      languages: LANGUAGE_OPTIONS,
      isReady,
    }),
    [language, handleSetLanguage, t, isReady],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      'useLanguage() harus digunakan di dalam <LanguageProvider>.',
    );
  }

  return context;
}

export function useOptionalLanguage():
  | LanguageContextValue
  | undefined {
  return useContext(LanguageContext);
}

export default LanguageContext;
