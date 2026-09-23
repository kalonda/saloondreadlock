import { Language } from '../types';
import { sw } from './sw';
import { en } from './en';
import { fr } from './fr';

export const translations = {
  sw,
  en,
  fr
};

export type TranslationsType = typeof sw;

export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString()} TZS`;
};

export const getTranslation = (lang: Language): TranslationsType => {
  return (translations[lang] as TranslationsType) || sw;
};
