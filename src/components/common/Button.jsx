import { Link } from 'react-router';
import { cn } from '../../utils/cn';
import { Spinner } from './Spinner';

const VARIANTS = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950',
  brand: 'bg-brand-500 text-slate-950 hover:bg-brand-400 active:bg-brand-600',
  secondary: 'bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 active:bg-slate-100',
  ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200',
  danger: 'bg-red-600 text-white hover:bg-red-500 active:bg-red-700',
  in: 'bg-stock-in text-white hover:brightness-110 active:brightness-95',
  out: 'bg-stock-out text-white hover:brightness-110 active:brightness-95',
};

// Minimum 44px touch target on every size except `sm`, which is desktop-only chrome.
const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
  icon: 'h-11 w-11',
};

/**
 * Button that can also render a router Link (pass `to`).
 * `loading` disables the button and shows a spinner while keeping its width.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  fullWidth,
  className,
  children,
  to,
  type = 'button',
  ...props
}) {
  const classes = cn(
    'inline-flex shrink-0 items-center justify-center rounded-lg font-semibold transition select-none',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className,
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
