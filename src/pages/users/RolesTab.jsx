import { Lock, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Sheet } from '../../components/common/Sheet';
import { ListSkeleton, QueryState } from '../../components/common/States';
import { TextField } from '../../components/forms/Field';
import { useDeleteRole, usePermissionList, useRoles, useSaveRole } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';
import { applyFieldErrors, getErrorMessage } from '../../utils/apiError';

const MODULE_LABELS = {
  dashboard: 'Dashboard',
  products: 'Products',
  masters: 'Masters & GST',
  inventory: 'Inventory',
  customers: 'Customers',
  invoices: 'Invoices',
  reports: 'Reports',
  administration: 'Administration',
};

function groupByModule(permissions) {
  const groups = new Map();
  for (const permission of permissions) {
    if (!groups.has(permission.module)) groups.set(permission.module, []);
    groups.get(permission.module).push(permission);
  }
  return [...groups.entries()];
}

function RoleForm({ role, onClose }) {
  const { user, reloadUser } = useAuth();
  const permissions = usePermissionList();
  const save = useSaveRole();
  const remove = useDeleteRole();
  const isSystem = role?.isSystem;
  const [selected, setSelected] = useState(() => new Set(role?.permissions ?? []));
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: role?.name ?? '', description: role?.description ?? '' } });

  function toggle(code) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleModule(codes, on) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const code of codes) {
        if (on) next.add(code);
        else next.delete(code);
      }
      return next;
    });
  }

  async function onSubmit(values) {
    const payload = {
      id: role?.id,
      name: values.name.trim(),
      description: values.description.trim() || null,
    };
    if (!isSystem) payload.permissions = [...selected];
    try {
      await save.mutateAsync(payload);
      if (role?.id === user.roleId) await reloadUser();
      toast.success(role ? 'Role updated' : 'Role created');
      onClose();
    } catch (error) {
      if (!applyFieldErrors(error, setError)) toast.error(getErrorMessage(error));
    }
  }

  async function onDelete() {
    try {
      await remove.mutateAsync(role.id);
      toast.success('Role deleted');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      size="lg"
      title={role ? `Edit role: ${role.name}` : 'New role'}
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
            Save role
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Role name"
            required
            disabled={isSystem}
            register={register('name', { required: 'Role name is required' })}
            error={errors.name}
          />
          <TextField
            label="Description"
            register={register('description')}
            error={errors.description}
          />
        </div>

        {isSystem ? (
          <p className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
            <Lock className="size-4" aria-hidden /> The Admin role always has every permission.
          </p>
        ) : permissions.isPending ? (
          <ListSkeleton rows={4} />
        ) : (
          <div className="space-y-4">
            {groupByModule(permissions.data ?? []).map(([module, items]) => {
              const codes = items.map((p) => p.code);
              const allOn = codes.every((c) => selected.has(c));
              return (
                <fieldset key={module} className="rounded-xl ring-1 ring-slate-200">
                  <legend className="sr-only">{MODULE_LABELS[module] ?? module}</legend>
                  <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                    <span className="text-sm font-semibold">{MODULE_LABELS[module] ?? module}</span>
                    <button
                      type="button"
                      className="text-brand-700 text-sm font-medium"
                      onClick={() => toggleModule(codes, !allOn)}
                    >
                      {allOn ? 'Clear' : 'Select all'}
                    </button>
                  </div>
                  <ul>
                    {items.map((permission) => (
                      <li key={permission.code}>
                        <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-1.5 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            className="size-5 rounded border-slate-300 accent-slate-900"
                            checked={selected.has(permission.code)}
                            onChange={() => toggle(permission.code)}
                          />
                          <span className="text-sm">{permission.description}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              );
            })}
          </div>
        )}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
      {role && !isSystem && (
        <button
          type="button"
          onClick={onDelete}
          disabled={remove.isPending}
          className="mt-6 text-sm font-medium text-red-600 hover:underline"
        >
          Delete role (only when no users are assigned)
        </button>
      )}
    </Sheet>
  );
}

export function RolesTab() {
  const roles = useRoles();
  const [editing, setEditing] = useState(undefined);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing(null)}>
          <Plus className="size-5" aria-hidden /> New role
        </Button>
      </div>
      <QueryState query={roles} isEmpty={(d) => d.length === 0}>
        {(data) => (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((role) => (
              <li key={role.id}>
                <Card
                  as="button"
                  type="button"
                  onClick={() => setEditing(role)}
                  className="h-full w-full p-4 text-left hover:ring-slate-300"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{role.name}</p>
                    {role.isSystem && <Badge tone="info">System</Badge>}
                  </div>
                  {role.description && (
                    <p className="mt-1 text-sm text-slate-500">{role.description}</p>
                  )}
                  <p className="mt-3 text-xs text-slate-500">
                    {role.userCount} user{role.userCount === 1 ? '' : 's'} ·{' '}
                    {role.permissions.length} permissions
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
      {editing !== undefined && (
        <RoleForm key={editing?.id ?? 'new'} role={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}
