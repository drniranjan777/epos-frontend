import { BRAND } from '../../constants/app';
import { cn } from '../../utils/cn';

/**
 * Company logo. `variant="full"` is the complete logo (needs a light background);
 * `variant="icon"` is the square app icon, for tight spaces such as the collapsed sidebar.
 */
export function Logo({ variant = 'full', className }) {
  const icon = variant === 'icon';
  return (
    <img
      src={icon ? BRAND.icon : BRAND.logo}
      alt={BRAND.name}
      width={icon ? 512 : 1328}
      height={icon ? 512 : 690}
      draggable={false}
      className={cn('w-auto shrink-0 select-none', icon ? 'aspect-square' : 'h-14', className)}
    />
  );
}
