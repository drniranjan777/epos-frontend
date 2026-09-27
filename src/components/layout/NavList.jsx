import { NavLink } from 'react-router';
import { cn } from '../../utils/cn';

/** Vertical navigation used by the desktop sidebar and the mobile drawer. */
export function NavList({ sections, onNavigate, dark = false }) {
  return (
    <nav className="space-y-6" aria-label="Main">
      {sections.map((section) => (
        <div key={section.title}>
          <p
            className={cn(
              'mb-2 px-3 text-xs font-semibold tracking-wider uppercase',
              dark ? 'text-slate-500' : 'text-slate-400',
            )}
          >
            {section.title}
          </p>
          <ul className="space-y-1">
            {section.items.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition',
                      dark
                        ? isActive
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        : isActive
                          ? 'bg-brand-50 ring-brand-200 text-slate-900 ring-1'
                          : 'text-slate-700 hover:bg-slate-100',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn('size-5', isActive && 'text-brand-500')} aria-hidden />
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
