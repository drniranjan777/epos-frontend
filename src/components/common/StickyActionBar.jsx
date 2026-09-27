import { cn } from '../../utils/cn';

/**
 * Primary form actions that stay visible while scrolling. On phones it sits just
 * above the bottom navigation; on desktop it sticks to the bottom of the content.
 */
export function StickyActionBar({ children, className }) {
  return (
    <div
      className={cn(
        'sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 mt-6 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:mx-0 lg:rounded-xl lg:border lg:shadow-sm',
        className,
      )}
    >
      <div className="flex gap-3 sm:justify-end">{children}</div>
    </div>
  );
}
