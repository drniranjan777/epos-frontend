import { Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { FullPageSpinner } from '../components/common/Spinner';
import { ListSkeleton } from '../components/common/States';
import { NAV_SECTIONS } from '../constants/navigation';
import { useAuth } from '../hooks/useAuth';
import { ForbiddenPage } from '../pages/errors/ForbiddenPage';

/** Requires a signed-in user; otherwise redirects to /login and remembers where to return. */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/** Only for signed-out users (login page). */
export function GuestRoute() {
  const { status } = useAuth();
  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <Outlet />;
}

/** Renders children only when the user holds at least one of `anyOf`. */
export function RequirePermission({ anyOf, children }) {
  const { canAny } = useAuth();
  return canAny(...anyOf) ? children : <ForbiddenPage />;
}

/**
 * Home: the dashboard for users who may see it, otherwise the first screen they can use.
 * This keeps a warehouse user without dashboard access one tap away from stock search.
 */
export function HomeRoute({ dashboard }) {
  const { canAny } = useAuth();
  const first = NAV_SECTIONS.flatMap((s) => s.items).find((item) => canAny(...item.anyOf));
  if (first?.to === '/') return dashboard;
  if (first) return <Navigate to={first.to} replace />;
  return <ForbiddenPage />;
}

/** Outlet for code-split pages: shows a skeleton while a page chunk downloads. */
export function LazyOutlet() {
  return (
    <Suspense fallback={<ListSkeleton rows={6} />}>
      <Outlet />
    </Suspense>
  );
}
