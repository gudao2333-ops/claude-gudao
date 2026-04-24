import Decimal from 'decimal.js';

export type DecimalLike = Decimal.Value | null | undefined;

export function safeDecimal(value: DecimalLike, fallback: Decimal.Value = 0): Decimal {
  try {
    if (value === null || value === undefined || value === '') return new Decimal(fallback);
    return new Decimal(value);
  } catch {
    return new Decimal(fallback);
  }
}

export function moneyToDecimal(value: DecimalLike): Decimal {
  return safeDecimal(value, 0).toDecimalPlaces(6, Decimal.ROUND_HALF_UP);
}

export function toCnyNumberString(value: DecimalLike): string {
  return moneyToDecimal(value).toFixed(6);
}

export function formatCny(value: DecimalLike): string {
  return `¥${moneyToDecimal(value).toFixed(2)}`;
}
