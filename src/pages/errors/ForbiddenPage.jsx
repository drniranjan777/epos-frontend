import { ShieldOff } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/States';

export function ForbiddenPage() {
  return (
    <EmptyState
      icon={ShieldOff}
      title="No access"
      message="Your role does not include permission for this screen. Ask an administrator if you need it."
      action={
        <Button to="/" variant="secondary">
          Go home
        </Button>
      }
    />
  );
}
