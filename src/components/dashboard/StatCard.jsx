import { Link } from 'react-router';
import { cn } from '../../utils/cn';
import { Card } from '../common/Card';

const ACCENTS = {
  neutral: 'bg-slate-100 text-slate-600',
  in: 'bg-stock-in-soft text-stock-in',
  out: 'bg-stock-out-soft text-stock-out',
  warning: 'bg-amber-100 text-amber-700',
  brand: 'bg-brand-100 text-brand-700',
};

export function StatCard({ label, value, hint, icon: Icon, accent = 'neutral', to }) {
  const content = (
    <Card className={cn('h-full p-4', to && 'transition hover:ring-slate-300')}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <span className={cn('rounded-lg p-1.5', ACCENTS[accent])}>
            <Icon className="size-4" aria-hidden />
          </span>
        )}
      </div>
      <p className="tabular mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
  return to ? (
    <Link to={to} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}
