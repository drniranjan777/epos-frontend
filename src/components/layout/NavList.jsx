import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { activeSectionId } from '../../constants/navigation';
import { useStoredState } from '../../hooks/useStoredState';
import { cn } from '../../utils/cn';

function NavItem({ item, onNavigate, compact, touch, tip }) {
  const { to, label, icon: Icon, end } = item;
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      aria-label={compact ? label : undefined}
      {...(compact ? tip?.(label) : null)}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center rounded-lg text-sm transition-colors focus-visible:-outline-offset-2',
          touch ? 'h-11' : 'h-10',
          compact ? 'w-10 justify-center' : 'gap-3 px-3',
          isActive
            ? 'bg-brand-50 text-brand-700 font-semibold'
            : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900',
          // Accent bar on the current page.
          isActive &&
            !compact &&
            'before:bg-brand-500 before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              'size-[18px] shrink-0 transition-colors',
              isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600',
            )}
            strokeWidth={1.9}
            aria-hidden
          />
          {!compact && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}

function NavSection({ section, open, active, onToggle, ...itemProps }) {
  const listId = useId();
  return (
    <div>
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={listId}
          className={cn(
            'flex h-8 w-full items-center justify-between rounded-md px-3 text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors focus-visible:-outline-offset-2',
            // A closed section still shows that it holds the current page.
            active && !open ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {section.title}
          <ChevronDown
            className={cn('size-3.5 transition-transform duration-200', !open && '-rotate-90')}
            aria-hidden
          />
        </button>
      </h3>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <ul id={listId} inert={!open} className="min-h-0 space-y-0.5 overflow-hidden">
          {section.items.map((item) => (
            <li key={item.to}>
              <NavItem item={item} {...itemProps} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Grouped navigation for the desktop sidebar and the phone drawer. Section headings expand
 * and collapse their pages (remembered on this device); the section of the page being shown
 * always opens. `compact` shows icons only, with `tip(label)` supplying tooltip handlers.
 * `touch` gives finger-sized rows.
 */
export function NavList({ sections, onNavigate, compact = false, touch = false, tip }) {
  const { pathname } = useLocation();
  const [stored, setStored] = useStoredState('nav.sections', {});
  const activeId = activeSectionId(sections, pathname);
  const isOpen = (section) => stored[section.id] ?? Boolean(section.defaultOpen);

  // Arriving on a page opens its section, even if it was closed earlier.
  const [seenPath, setSeenPath] = useState(null);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    if (activeId && stored[activeId] !== true) setStored({ ...stored, [activeId]: true });
  }

  if (compact) {
    return (
      <nav className="flex flex-col items-center" aria-label="Main">
        {sections.map((section, index) => (
          <ul
            key={section.id}
            aria-label={section.title}
            className={cn('space-y-0.5', index > 0 && 'mt-2 border-t border-slate-200 pt-2')}
          >
            {section.items.map((item) => (
              <li key={item.to}>
                <NavItem item={item} onNavigate={onNavigate} compact tip={tip} />
              </li>
            ))}
          </ul>
        ))}
      </nav>
    );
  }

  return (
    <nav className="space-y-3" aria-label="Main">
      {sections.map((section) => (
        <NavSection
          key={section.id}
          section={section}
          open={isOpen(section)}
          active={section.id === activeId}
          onToggle={() => setStored({ ...stored, [section.id]: !isOpen(section) })}
          onNavigate={onNavigate}
          touch={touch}
        />
      ))}
    </nav>
  );
}
