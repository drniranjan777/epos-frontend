import { SearchX } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/States';

export function NotFoundPage() {
  return (
    <EmptyState
      icon={SearchX}
      title="Page not found"
      message="The page you opened does not exist or has moved."
      action={
        <Button to="/" variant="secondary">
          Go home
        </Button>
      }
    />
  );
}
