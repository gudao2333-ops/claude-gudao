import { formatCny } from '@/lib/decimal';

export function MoneyText({ value, className = '' }: { value: string | number; className?: string }) {
  return <span className={className}>{formatCny(value)}</span>;
}
