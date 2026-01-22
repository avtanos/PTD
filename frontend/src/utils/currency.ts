/**
 * Форматирование валюты: сомы и доллары
 */

export type Currency = 'KGS' | 'USD';

/**
 * Форматирует число в сомах
 */
export const formatKGS = (value?: number | null): string => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KGS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Форматирует число в долларах
 */
export const formatUSD = (value?: number | null): string => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Форматирует число с указанием валюты
 */
export const formatCurrency = (value?: number | null, currency: Currency = 'KGS'): string => {
  if (value === undefined || value === null) return '-';
  return currency === 'USD' ? formatUSD(value) : formatKGS(value);
};

/**
 * Форматирует число с разделителями и символом валюты
 */
export const formatCurrencySimple = (value?: number | null, currency: Currency = 'KGS'): string => {
  if (value === undefined || value === null) return '-';
  const formatted = value.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = currency === 'USD' ? '$' : 'сом';
  return `${formatted} ${symbol}`;
};

/**
 * Форматирует число с разделителями и символом валюты (краткий формат)
 */
export const formatCurrencyShort = (value?: number | null, currency: Currency = 'KGS'): string => {
  if (value === undefined || value === null) return '-';
  const formatted = value.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const symbol = currency === 'USD' ? '$' : 'сом';
  return `${formatted} ${symbol}`;
};
