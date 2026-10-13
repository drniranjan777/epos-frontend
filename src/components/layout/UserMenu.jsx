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
        'bg-brand-500 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-slate-950',
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

function UserIdentity({ user }) {
  return (
    <>
      <Avatar name={user.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
        <p className="truncate text-xs text-slate-500">{user.roleName}</p>
      </div>
    </>
  );
}

/** Current user, change password and sign out, as full rows (phone drawer). */
export function UserPanel({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const itemClass =
    'flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100';

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3 px-3 py-2">
        <UserIdentity user={user} />
      </div>
      <button
        type="button"
        className={itemClass}
        onClick={() => {
          onNavigate?.();
          navigate('/account');
        }}
      >
        <KeyRound className="size-5 text-slate-400" aria-hidden />
        Change password
      </button>
      <button type="button" className={itemClass} onClick={logout}>
        <LogOut className="size-5 text-slate-400" aria-hidden />
        Sign out
      </button>
    </div>
  );
}

/**
 * Current user for the foot of the desktop sidebar: one row with icon actions, or a
 * stack of icons when the sidebar is `compact`. `tip(label)` supplies tooltip handlers.
 */
export function SidebarUser({ compact = false, tip }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const actionClass =
    'flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900';
  const actions = (
    <>
      <button
        type="button"
        className={actionClass}
        aria-label="Change password"
        onClick={() => navigate('/account')}
        {...tip?.('Change password')}
      >
        <KeyRound className="size-[18px]" aria-hidden />
      </button>
      <button
        type="button"
        className={actionClass}
        aria-label="Sign out"
        onClick={logout}
        {...tip?.('Sign out')}
      >
        <LogOut className="size-[18px]" aria-hidden />
      </button>
    </>
  );

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span tabIndex={0} className="rounded-full" {...tip?.(`${user.name} · ${user.roleName}`)}>
          <Avatar name={user.name} />
          <span className="sr-only">
            {user.name}, {user.roleName}
          </span>
        </span>
        {actions}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 pl-1">
      <UserIdentity user={user} />
      <div className="flex">{actions}</div>
    </div>
  );
}
