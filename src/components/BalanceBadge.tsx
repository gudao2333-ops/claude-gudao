import { MoneyText } from './MoneyText';

export function BalanceBadge({ balance }: { balance: string | number }) {
  return (
    <div className="rounded-full border border-stone-200 bg-white px-3 py-1 text-sm text-stone-700">
      余额：<MoneyText value={balance} className="font-semibold" />
    </div>
  );
}
