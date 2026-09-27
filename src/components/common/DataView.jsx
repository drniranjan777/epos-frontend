import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '../../utils/cn';

/**
 * Cards on phones, a table from the `md` breakpoint up — the same data, two layouts.
 *
 * @param {object[]} items
 * @param {{ header: string, cell: (item) => React.ReactNode, className?: string, align?: 'right' }[]} columns
 * @param {(item) => React.ReactNode} renderCard  card body for mobile
 * @param {(item) => string} [getLink]           makes rows/cards navigable
 */
export function DataView({ items, columns, renderCard, getLink, keyField = 'id' }) {
  return (
    <>
      <ul className="divide-y divide-slate-100 md:hidden">
        {items.map((item) => {
          const href = getLink?.(item);
          const body = <div className="min-w-0 flex-1">{renderCard(item)}</div>;
          return (
            <li key={item[keyField]}>
              {href ? (
                <Link to={href} className="flex items-center gap-3 px-4 py-3 active:bg-slate-50">
                  {body}
                  <ChevronRight className="size-5 shrink-0 text-slate-300" aria-hidden />
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {columns.map((col) => (
                <th
                  key={col.header}
                  scope="col"
                  className={cn('px-4 py-3', col.align === 'right' && 'text-right', col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const href = getLink?.(item);
              return (
                <tr key={item[keyField]} className={cn(href && 'relative hover:bg-slate-50')}>
                  {columns.map((col, index) => (
                    <td
                      key={col.header}
                      className={cn(
                        'px-4 py-3 align-middle',
                        col.align === 'right' && 'tabular text-right',
                        col.className,
                      )}
                    >
                      {/* The first cell's link stretches over the whole row. */}
                      {href && index === 0 ? (
                        <Link to={href} className="after:absolute after:inset-0">
                          {col.cell(item)}
                        </Link>
                      ) : (
                        col.cell(item)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
