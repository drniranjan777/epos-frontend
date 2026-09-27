import { useSearchParams } from 'react-router';
import { PageHeader } from '../../components/common/PageHeader';
import { PERMISSIONS as P } from '../../constants/permissions';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';
import { RolesTab } from './RolesTab';
import { UsersTab } from './UsersTab';

export function UsersPage() {
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const tabs = [
    can(P.USERS_MANAGE) && { key: 'users', label: 'Users' },
    can(P.ROLES_MANAGE) && { key: 'roles', label: 'Roles & permissions' },
  ].filter(Boolean);
  const active = tabs.find((t) => t.key === params.get('tab')) ?? tabs[0];

  return (
    <div>
      <PageHeader title="Users & Roles" />
      {tabs.length > 1 && (
        <div role="tablist" className="mb-4 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={tab.key === active.key}
              onClick={() => setParams({ tab: tab.key }, { replace: true })}
              className={cn(
                'h-10 rounded-full px-4 text-sm font-semibold ring-1',
                tab.key === active.key
                  ? 'bg-slate-900 text-white ring-slate-900'
                  : 'bg-white text-slate-700 ring-slate-300',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      {active.key === 'users' ? <UsersTab /> : <RolesTab />}
    </div>
  );
}
