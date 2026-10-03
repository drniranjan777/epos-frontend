import { Store } from 'lucide-react';
import { EmptyState } from '../../components/common/States';

export function NoBranchPage() {
  return (
    <EmptyState
      icon={Store}
      title="No branch assigned"
      message="Your account is not linked to any branch yet. Ask an administrator to assign you to a branch."
    />
  );
}
