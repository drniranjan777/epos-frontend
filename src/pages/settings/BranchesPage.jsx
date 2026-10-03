import { Building2, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataView } from '../../components/common/DataView';
import { PageHeader } from '../../components/common/PageHeader';
import { Sheet } from '../../components/common/Sheet';
import { EmptyState, ListSkeleton, QueryState } from '../../components/common/States';
import { SelectField, Switch, TextAreaField, TextField } from '../../components/forms/Field';
import { useStates } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';
import { useBranchList, useSaveBranch } from '../../hooks/useStockDocuments';
import { applyFieldErrors, getErrorMessage } from '../../utils/apiError';
import { emptyToNull, toFormValues } from '../../utils/formHelpers';

const FIELDS = ['code', 'name', 'address', 'city', 'pincode', 'stateCode', 'phone', 'gstin'];

function BranchForm({ branch, onClose }) {
  const states = useStates();
  const save = useSaveBranch();
  const { reloadUser } = useAuth();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { ...toFormValues(branch, FIELDS), isActive: branch?.isActive ?? true },
  });

  async function onSubmit(values) {
    const { isActive, ...rest } = values;
    const payload = { id: branch?.id, ...emptyToNull(rest) };
    if (branch) payload.isActive = isActive;
    try {
      await save.mutateAsync(payload);
      // New or renamed branches change the branch selector.
      await reloadUser();
      toast.success(branch ? 'Branch updated' : 'Branch created');
      onClose();
    } catch (error) {
      if (!applyFieldErrors(error, setError)) toast.error(getErrorMessage(error));
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={branch ? `Edit ${branch.name}` : 'New branch'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
            Save
          </Button>
        </>
      }
    >
      {states.isPending ? (
        <ListSkeleton rows={4} />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Code"
            required
            autoCapitalize="characters"
            hint="Short code, e.g. HYD"
            register={register('code', { required: 'Code is required' })}
            error={errors.code}
          />
          <TextField
            label="Branch name"
            required
            register={register('name', { required: 'Name is required' })}
            error={errors.name}
          />
          <TextAreaField
            label="Address"
            className="sm:col-span-2"
            rows={2}
            register={register('address')}
            error={errors.address}
          />
          <TextField label="City" register={register('city')} error={errors.city} />
          <TextField
            label="Pincode"
            inputMode="numeric"
            register={register('pincode')}
            error={errors.pincode}
          />
          <SelectField label="State" register={register('stateCode')} error={errors.stateCode}>
            <option value="">Select state</option>
            {(states.data ?? []).map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.code})
              </option>
            ))}
          </SelectField>
          <TextField label="Phone" type="tel" register={register('phone')} error={errors.phone} />
          <TextField
            label="GSTIN"
            className="sm:col-span-2"
            autoCapitalize="characters"
            hint="Only if this branch has its own GST registration"
            register={register('gstin')}
            error={errors.gstin}
          />
          {branch && (
            <div className="sm:col-span-2">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    label="Active"
                    description={
                      branch.isDefault
                        ? 'The default branch is always active.'
                        : 'Only branches without stock or open transfers can be deactivated.'
                    }
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={branch.isDefault}
                  />
                )}
              />
            </div>
          )}
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      )}
    </Sheet>
  );
}

export function BranchesPage() {
  const branches = useBranchList();
  const [editing, setEditing] = useState(undefined);

  const columns = [
    {
      header: 'Branch',
      cell: (b) => (
        <span className="font-medium">
          {b.name} {b.isDefault && <Badge tone="info">Default</Badge>}
        </span>
      ),
    },
    { header: 'Code', cell: (b) => <span className="font-mono text-xs">{b.code}</span> },
    { header: 'Location', cell: (b) => [b.city, b.state].filter(Boolean).join(', ') || '—' },
    { header: 'Users', align: 'right', cell: (b) => b.userCount },
    {
      header: 'Status',
      cell: (b) => (b.isActive ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>),
    },
    {
      header: '',
      align: 'right',
      cell: (b) => (
        <Button variant="ghost" size="sm" onClick={() => setEditing(b)}>
          <Pencil className="size-4" aria-hidden /> Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Branches"
        subtitle="Warehouses holding stock. Assign users to branches under Users & Roles."
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus className="size-5" aria-hidden /> New branch
          </Button>
        }
      />
      <Card className="overflow-hidden">
        <QueryState
          query={branches}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState icon={Building2} title="No branches" />}
        >
          {(data) => (
            <DataView
              items={data}
              columns={columns}
              renderCard={(b) => (
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 text-left"
                  onClick={() => setEditing(b)}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {b.name} {b.isDefault && <Badge tone="info">Default</Badge>}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {[b.code, b.city, `${b.userCount} users`].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {!b.isActive && <Badge>Inactive</Badge>}
                </button>
              )}
            />
          )}
        </QueryState>
      </Card>
      {editing !== undefined && (
        <BranchForm
          key={editing?.id ?? 'new'}
          branch={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}
