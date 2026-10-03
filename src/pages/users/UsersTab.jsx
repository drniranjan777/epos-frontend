import { Pencil, Plus, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataView } from '../../components/common/DataView';
import { Pagination } from '../../components/common/Pagination';
import { SearchInput } from '../../components/common/SearchInput';
import { Sheet } from '../../components/common/Sheet';
import { EmptyState, ListSkeleton, QueryState } from '../../components/common/States';
import { SelectField, Switch, TextField } from '../../components/forms/Field';
import { PAGE_SIZE } from '../../constants/app';
import { PERMISSIONS } from '../../constants/permissions';
import { useRoles, useSaveUser, useUsers } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { useBranchList } from '../../hooks/useStockDocuments';
import { applyFieldErrors, getErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/format';

/** Branch checkboxes; hidden for roles that may work in every branch. */
function BranchChecklist({ control, roles }) {
  const branches = useBranchList({ isActive: true });
  const roleId = useWatch({ control, name: 'roleId' });
  const role = roles.find((r) => r.id === Number(roleId));
  if (role?.permissions.includes(PERMISSIONS.BRANCHES_ALL)) {
    return (
      <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
        The {role.name} role works in every branch.
      </p>
    );
  }
  return (
    <Controller
      name="branchIds"
      control={control}
      render={({ field, fieldState }) => (
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-700">
            Branches<span className="ml-0.5 text-red-500">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {(branches.data ?? []).map((b) => {
              const checked = field.value.includes(b.id);
              return (
                <label
                  key={b.id}
                  className={`flex h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm ring-1 ${
                    checked ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white ring-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() =>
                      field.onChange(
                        checked ? field.value.filter((id) => id !== b.id) : [...field.value, b.id],
                      )
                    }
                  />
                  {b.name}
                </label>
              );
            })}
          </div>
          {fieldState.error && (
            <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
          )}
        </fieldset>
      )}
    />
  );
}

const PASSWORD_RULES = {
  minLength: { value: 8, message: 'At least 8 characters' },
  validate: (v) => !v || (/[A-Za-z]/.test(v) && /[0-9]/.test(v)) || 'Use letters and numbers',
};

function UserForm({ user, onClose }) {
  const { user: me, reloadUser } = useAuth();
  const roles = useRoles();
  const save = useSaveUser();
  const isEdit = Boolean(user);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name ?? '',
      username: user?.username ?? '',
      email: user?.email ?? '',
      mobile: user?.mobile ?? '',
      roleId: user?.roleId ?? '',
      password: '',
      isActive: user?.isActive ?? true,
      branchIds: user?.branchIds ?? [],
    },
  });

  async function onSubmit(values) {
    const role = (roles.data ?? []).find((r) => r.id === Number(values.roleId));
    const allBranches = role?.permissions.includes(PERMISSIONS.BRANCHES_ALL);
    if (!allBranches && values.branchIds.length === 0) {
      setError('branchIds', { message: 'Select at least one branch' });
      return;
    }
    const payload = {
      id: user?.id,
      name: values.name.trim(),
      username: values.username.trim(),
      email: values.email.trim() || null,
      mobile: values.mobile.trim() || null,
      roleId: Number(values.roleId),
      branchIds: values.branchIds,
    };
    if (values.password) payload.password = values.password;
    if (isEdit) payload.isActive = values.isActive;
    try {
      await save.mutateAsync(payload);
      if (user?.id === me.id) await reloadUser();
      toast.success(isEdit ? 'User updated' : 'User created');
      onClose();
    } catch (error) {
      if (!applyFieldErrors(error, setError)) toast.error(getErrorMessage(error));
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={isEdit ? 'Edit user' : 'New user'}
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
            Save
          </Button>
        </>
      }
    >
      {roles.isPending ? (
        <ListSkeleton rows={4} />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <TextField
            label="Full name"
            required
            register={register('name', { required: 'Name is required' })}
            error={errors.name}
          />
          <TextField
            label="Username"
            required
            autoCapitalize="none"
            autoCorrect="off"
            register={register('username', {
              required: 'Username is required',
              pattern: { value: /^[A-Za-z0-9._-]{3,50}$/, message: '3–50 letters, numbers, . _ -' },
            })}
            error={errors.username}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Email"
              type="email"
              register={register('email')}
              error={errors.email}
            />
            <TextField
              label="Mobile"
              type="tel"
              register={register('mobile')}
              error={errors.mobile}
            />
          </div>
          <SelectField
            label="Role"
            required
            register={register('roleId', { required: 'Select a role' })}
            error={errors.roleId}
          >
            <option value="">Select role</option>
            {(roles.data ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </SelectField>
          <BranchChecklist control={control} roles={roles.data ?? []} />
          <TextField
            label={isEdit ? 'Reset password' : 'Password'}
            type="password"
            autoComplete="new-password"
            required={!isEdit}
            hint={
              isEdit
                ? 'Leave empty to keep the current password'
                : 'At least 8 characters with a letter and a number'
            }
            register={register('password', {
              ...PASSWORD_RULES,
              required: isEdit ? false : 'Password is required',
            })}
            error={errors.password}
          />
          {isEdit && (
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch
                  label="Active"
                  description="Inactive users are signed out and cannot log in."
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={user.id === me.id}
                />
              )}
            />
          )}
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      )}
    </Sheet>
  );
}

export function UsersTab() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search.trim());
  const users = useUsers({ page, limit: PAGE_SIZE, search: debounced || undefined });
  const [editing, setEditing] = useState(undefined);

  const columns = [
    {
      header: 'User',
      cell: (u) => (
        <>
          <span className="font-medium">{u.name}</span>
          <span className="block text-xs text-slate-500">@{u.username}</span>
        </>
      ),
    },
    { header: 'Role', cell: (u) => u.roleName },
    { header: 'Contact', cell: (u) => [u.mobile, u.email].filter(Boolean).join(' · ') || '—' },
    {
      header: 'Last login',
      cell: (u) => (u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never'),
    },
    {
      header: 'Status',
      cell: (u) => (u.isActive ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>),
    },
    {
      header: '',
      align: 'right',
      cell: (u) => (
        <Button variant="ghost" size="sm" onClick={() => setEditing(u)}>
          <Pencil className="size-4" aria-hidden /> Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          className="min-w-0 flex-1 sm:max-w-sm"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search users"
        />
        <Button onClick={() => setEditing(null)}>
          <Plus className="size-5" aria-hidden /> New user
        </Button>
      </div>
      <Card className="overflow-hidden">
        <QueryState
          query={users}
          isEmpty={(d) => d.items.length === 0}
          empty={<EmptyState icon={UserPlus} title="No users found" />}
        >
          {(data) => (
            <>
              <DataView
                items={data.items}
                columns={columns}
                renderCard={(u) => (
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 text-left"
                    onClick={() => setEditing(u)}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{u.name}</p>
                      <p className="truncate text-sm text-slate-500">
                        @{u.username} · {u.roleName}
                      </p>
                    </div>
                    {!u.isActive && <Badge>Inactive</Badge>}
                  </button>
                )}
              />
              <Pagination meta={data.meta} isFetching={users.isFetching} onPageChange={setPage} />
            </>
          )}
        </QueryState>
      </Card>
      {editing !== undefined && (
        <UserForm key={editing?.id ?? 'new'} user={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}
