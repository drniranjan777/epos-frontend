import { KeyRound, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function Avatar({ name, className }) {
  return (
    <span
      className={cn(
        'bg-brand-500 inline-flex size-9 items-center justify-center rounded-full text-sm font-bold text-slate-950',
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

/** Current user, change password and sign out. */
export function UserPanel({ onNavigate, dark = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const itemClass = cn(
    'flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium',
    dark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100',
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3 px-3 py-2">
        <Avatar name={user.name} />
        <div className="min-w-0">
          <p
            className={cn('truncate text-sm font-semibold', dark ? 'text-white' : 'text-slate-900')}
          >
            {user.name}
          </p>
          <p className={cn('truncate text-xs', dark ? 'text-slate-400' : 'text-slate-500')}>
            {user.roleName}
          </p>
        </div>
      </div>
      <button
        type="button"
        className={itemClass}
        onClick={() => {
          onNavigate?.();
          navigate('/account');
        }}
      >
        <KeyRound className="size-5" aria-hidden />
        Change password
      </button>
      <button type="button" className={itemClass} onClick={logout}>
        <LogOut className="size-5" aria-hidden />
        Sign out
      </button>
    </div>
  );
}
