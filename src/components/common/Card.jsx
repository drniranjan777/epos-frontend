import { cn } from '../../utils/cn';

export function Card({ className, children, as: Component = 'div', ...props }) {
  return (
    <Component
      className={cn('rounded-xl bg-white shadow-sm ring-1 ring-slate-200', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-4 pt-4', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn('p-4', className)}>{children}</div>;
}
