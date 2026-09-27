import { useIsDesktop } from '../hooks/useMediaQuery';
import { AdminLayout } from './AdminLayout';
import { MobileLayout } from './MobileLayout';

/** Chooses the phone or desktop shell. Both render the current route through <Outlet />. */
export function AppLayout() {
  return useIsDesktop() ? <AdminLayout /> : <MobileLayout />;
}
