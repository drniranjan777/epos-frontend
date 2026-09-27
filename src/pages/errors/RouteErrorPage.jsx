import { AlertTriangle } from 'lucide-react';
import { useRouteError } from 'react-router';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/States';

/** Shown when a route fails to render (e.g. a lazy chunk failed to load after a deploy). */
export function RouteErrorPage() {
  const error = useRouteError();
  const chunkFailed = /dynamically imported module|Loading chunk/i.test(error?.message ?? '');
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <EmptyState
        icon={AlertTriangle}
        title={chunkFailed ? 'A new version is available' : 'Something went wrong'}
        message={
          chunkFailed
            ? 'Reload to get the latest version of the app.'
            : 'Reload the page to try again.'
        }
        action={<Button onClick={() => window.location.reload()}>Reload</Button>}
      />
    </div>
  );
}
