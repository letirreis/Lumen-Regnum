import { translate, TKey } from './index';

/**
 * Converte mensagens técnicas do banco (QUOTA_EXCEEDED:..., FEATURE_LOCKED:...) em texto amigável
 * no idioma atual. Devolve null se a mensagem não for uma das conhecidas.
 */
export function translateDbError(message: string | undefined | null): string | null {
  if (!message) return null;
  const quota = /QUOTA_EXCEEDED:(\w+):(\d+):(\w+)/.exec(message);
  if (quota) {
    const [, table, limit] = quota;
    return translate('quota.exceeded', {
      what: translate(`plan.res.${table}` as TKey),
      limit,
    });
  }
  if (/FEATURE_LOCKED/.test(message)) return translate('quota.featureLocked');
  if (/ROW_TOO_LARGE/.test(message)) return translate('quota.rowTooLarge');
  return null;
}
