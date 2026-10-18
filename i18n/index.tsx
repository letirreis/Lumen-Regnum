import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ptBR } from './locales/pt-BR';
import { en } from './locales/en';
import { supabase } from '../services/supabase';

// ---------------------------------------------------------------------------
// Sistema de tradução do Lumen Regnum
//
// - pt-BR é a língua-base: `locales/pt-BR` define TODAS as chaves (e o tipo TKey).
// - Para adicionar o inglês: preencha `locales/en` (pode ser parcial; o que faltar cai em pt-BR)
//   e mostre um seletor chamando `setLocale('en')` (já está pronto, ver useI18n).
// - Valores gravados no banco (ex.: 'Rare', 'Combat', 'active') NUNCA mudam. Só o rótulo exibido é
//   traduzido, via `optLabel(grupo, valor)` -> chave `opt.<grupo>.<valor_em_slug>`.
// ---------------------------------------------------------------------------

export type Locale = 'pt-BR' | 'en';
type MessageKey = keyof typeof ptBR;
// Chaves de plural (`x_one` / `x_other`) são usadas como `t('x', { count })`; por isso o sufixo é removido do tipo.
type StripPlural<K> = K extends `${infer B}_${'one' | 'other'}` ? B : K;
export type TKey = StripPlural<MessageKey>;
export type Messages = Partial<Record<MessageKey, string>>;
export type TParams = Record<string, string | number>;

export const SUPPORTED_LOCALES: { code: Locale; label: string }[] = [
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'en', label: 'English' },
];

const STORAGE_KEY = 'lumen_locale';
const DICTIONARIES: Record<Locale, Messages> = { 'pt-BR': ptBR, en };

const readStoredLocale = (): Locale => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pt-BR' || saved === 'en') return saved;
  } catch { /* localStorage indisponível: usa o padrão */ }
  try {
    const nav = (navigator.languages?.[0] || navigator.language || '').toLowerCase();
    if (nav.startsWith('pt')) return 'pt-BR';
    if (nav.startsWith('en')) return 'en';
  } catch { /* sem navigator */ }
  return 'en';
};

let currentLocale: Locale = readStoredLocale();

const applyDocument = (l: Locale) => {
  try {
    document.documentElement.lang = l;
    document.title = translate('app.documentTitle', undefined, l);
  } catch { /* sem document */ }
};

const interpolate = (text: string, params?: TParams) =>
  params ? text.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`)) : text;

/**
 * Traduz uma chave. Se `params.count` existir, procura `<chave>_one` / `<chave>_other` (plural).
 * Funciona fora de componentes React (ex.: serviços, utilitários).
 */
export function translate(key: TKey, params?: TParams, locale: Locale = currentLocale): string {
  let k: string = key;
  if (params && typeof params.count === 'number') {
    const form = new Intl.PluralRules(locale).select(params.count) === 'one' ? 'one' : 'other';
    const pluralKey = `${key}_${form}`;
    if (pluralKey in ptBR) k = pluralKey;
  }
  const dict = DICTIONARIES[locale] as Record<string, string | undefined>;
  const text = dict[k] ?? (ptBR as Record<string, string>)[k] ?? k;
  return interpolate(text, params);
}

const slug = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/**
 * Rótulo de um valor gravado no banco. Ex.: optLabel('rarity', 'Very Rare') -> "Muito Raro".
 * Se não houver tradução (valor digitado pelo usuário, por exemplo), devolve o próprio valor.
 */
export function optLabel(group: string, value: string | null | undefined, locale: Locale = currentLocale): string {
  if (!value) return '';
  const key = `opt.${group}.${slug(value)}`;
  const dict = DICTIONARIES[locale] as Record<string, string | undefined>;
  return dict[key] ?? value;
}

export const getLocale = () => currentLocale;

interface I18nContextValue {
  locale: Locale;
  /** `remote: false` aplica o idioma sem gravá-lo na conta (usado ao carregar o idioma da conta). */
  setLocale: (l: Locale, opts?: { remote?: boolean }) => void;
  t: (key: TKey, params?: TParams) => string;
  opt: (group: string, value: string | null | undefined) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  weekdays: string[]; // domingo -> sábado, abreviados
  monthYear: (date: Date) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(currentLocale);
  useEffect(() => { applyDocument(currentLocale); }, []);

  const setLocale = useCallback((l: Locale, opts?: { remote?: boolean }) => {
    currentLocale = l;
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignora */ }
    applyDocument(l);
    setLocaleState(l);
    if (opts?.remote !== false && supabase) {
      // Guarda o idioma na conta (user_metadata), se houver login. Falha silenciosa: o local já vale.
      supabase.auth.getSession()
        .then(({ data }) => (data.session ? supabase!.auth.updateUser({ data: { locale: l } }) : null))
        .catch(() => { /* ignora */ });
    }
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const toDate = (d: Date | string | number) => (d instanceof Date ? d : new Date(d));
    return {
      locale,
      setLocale,
      t: (key, params) => translate(key, params, locale),
      opt: (group, v) => optLabel(group, v, locale),
      formatDate: (d, o = { day: '2-digit', month: 'short', year: 'numeric' } as Intl.DateTimeFormatOptions) => toDate(d).toLocaleDateString(locale, o),
      formatTime: (d, o = { hour: '2-digit', minute: '2-digit' } as Intl.DateTimeFormatOptions) => toDate(d).toLocaleTimeString(locale, o),
      weekdays: Array.from({ length: 7 }, (_, i) =>
        new Date(2024, 0, 7 + i).toLocaleDateString(locale, { weekday: 'short' }).replace('.', '')), // 7/jan/2024 = domingo
      monthYear: (d) => d.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n precisa estar dentro de <I18nProvider>');
  return ctx;
}
