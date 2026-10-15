import type { TKey } from './index';

// Traduz as mensagens de erro (em inglês) devolvidas pelo Supabase Auth para chaves do dicionário.
// Mensagens desconhecidas caem em `fallback` para não mostrar texto em inglês solto sempre que possível.
const RULES: [RegExp, TKey][] = [
  [/invalid login credentials/i, 'authError.invalidCredentials'],
  [/email not confirmed/i, 'authError.emailNotConfirmed'],
  [/user already registered|already been registered/i, 'authError.alreadyRegistered'],
  [/password should be at least|password is too short/i, 'authError.weakPassword'],
  [/rate limit|too many requests|after \d+ seconds/i, 'authError.rateLimit'],
  [/failed to fetch|network/i, 'authError.network'],
  [/invalid email|unable to validate email/i, 'authError.invalidEmail'],
  [/same password|different from the old/i, 'authError.samePassword'],
  [/weak|pwned|compromised/i, 'authError.weakPassword'],
];

export function authErrorKey(raw: string | undefined | null): TKey | null {
  if (!raw) return null;
  for (const [re, key] of RULES) if (re.test(raw)) return key;
  return null;
}
