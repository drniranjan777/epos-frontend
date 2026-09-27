import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useDeleteMaster, useMasterList, useSaveMaster } from '../../hooks/useMasters';
import { applyFieldErrors, getErrorMessage } from '../../utils/apiError';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { DataView } from '../common/DataView';
import { SearchInput } from '../common/SearchInput';
import { Sheet } from '../common/Sheet';
import { EmptyState, QueryState } from '../common/States';
import { SelectField, Switch, TextField } from './Field';

/**
 * @typedef {object} MasterField
 * @property {string} name
 * @property {string} label
 * @property {'text'|'number'|'select'|'switch'} [type]
 * @property {boolean} [required]
 * @property {boolean} [lockedOnEdit]  shown read-only when editing (e.g. codes, GST rate value)
 * @property {(records: object[], editing: object|null) => {value: string, label: string}[]} [options]
 * @property {string} [hint]
 * @property {(value: any) => any} [parse] converts the form value before saving
 */

function MasterForm({ name, entity, fields, records, editing, onClose }) {
  const save = useSaveMaster(name);
  const remove = useDeleteMaster(name);
  const defaults = Object.fromEntries(
    fields.map((f) => [
      f.name,
      editing?.[f.name] ?? (f.type === 'switch' ? (f.defaultValue ?? false) : ''),
    ]),
  );
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { ...defaults, isActive: editing?.isActive ?? true } });

  async function onSubmit(values) {
    const payload = {};
    for (const field of fields) {
      if (editing && field.lockedOnEdit) continue;
      const raw = values[field.name];
      payload[field.name] = field.parse
        ? field.parse(raw)
        : typeof raw === 'string'
          ? raw.trim()
          : raw;
    }
    if (editing) payload.isActive = values.isActive;
    try {
      await save.mutateAsync({ id: editing?.id, ...payload });
      toast.success(`${entity} ${editing ? 'updated' : 'created'}`);
      onClose();
    } catch (error) {
      if (!applyFieldErrors(error, setError)) toast.error(getErrorMessage(error));
    }
  }

  async function onDelete() {
    try {
      await remove.mutateAsync(editing.id);
      toast.success(`${entity} deleted`);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={editing ? `Edit ${entity.toLowerCase()}` : `New ${entity.toLowerCase()}`}
      size="sm"
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
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {fields.map((field) => {
          const locked = editing && field.lockedOnEdit;
          const rules = field.required ? { required: `${field.label} is required` } : {};
          if (field.type === 'switch') {
            return (
              <Controller
                key={field.name}
                name={field.name}
                control={control}
                render={({ field: f }) => (
                  <Switch
                    label={field.label}
                    description={field.hint}
                    checked={Boolean(f.value)}
                    onChange={f.onChange}
                    disabled={locked}
                  />
                )}
              />
            );
          }
          if (field.type === 'select') {
            return (
              <SelectField
                key={field.name}
                label={field.label}
                required={field.required}
                disabled={locked}
                register={register(field.name, rules)}
                error={errors[field.name]}
              >
                <option value="">{field.placeholder ?? 'Select'}</option>
                {field.options(records, editing).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SelectField>
            );
          }
          return (
            <TextField
              key={field.name}
              label={field.label}
              required={field.required}
              hint={locked ? 'Cannot be changed after creation' : field.hint}
              disabled={locked}
              inputMode={field.type === 'number' ? 'decimal' : undefined}
              autoCapitalize={field.uppercase ? 'characters' : undefined}
              register={register(field.name, rules)}
              error={errors[field.name]}
            />
          );
        })}
        {editing && (
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Switch
                label="Active"
                description="Inactive records are hidden from dropdowns."
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        )}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
      {editing && (
        <button
          type="button"
          onClick={onDelete}
          disabled={remove.isPending}
          className="mt-6 text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
        >
          Delete {entity.toLowerCase()} (only if never used)
        </button>
      )}
    </Sheet>
  );
}

/** List + create/edit sheet for a simple master table. */
export function MasterManager({
  name,
  entity,
  fields,
  columns,
  renderCard,
  searchPlaceholder = 'Search',
}) {
  const [search, setSearch] = useState('');
  const list = useMasterList(name);
  const [editing, setEditing] = useState(undefined);

  const term = search.trim().toLowerCase();
  const filter = (records) =>
    term
      ? records.filter((r) =>
          fields.some((f) =>
            String(r[f.name] ?? '')
              .toLowerCase()
              .includes(term),
          ),
        )
      : records;

  const statusColumn = {
    header: 'Status',
    cell: (r) => (r.isActive ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>),
  };
  const editColumn = {
    header: '',
    align: 'right',
    cell: (r) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setEditing(r)}
        aria-label={`Edit ${r.name ?? r.code}`}
      >
        <Pencil className="size-4" /> Edit
      </Button>
    ),
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          className="min-w-0 flex-1 sm:max-w-sm"
          value={search}
          onChange={setSearch}
          placeholder={searchPlaceholder}
        />
        <Button onClick={() => setEditing(null)}>
          <Plus className="size-5" aria-hidden /> Add {entity.toLowerCase()}
        </Button>
      </div>
      <Card className="overflow-hidden">
        <QueryState
          query={list}
          isEmpty={(d) => filter(d).length === 0}
          empty={<EmptyState title={`No ${entity.toLowerCase()} records`} />}
        >
          {(records) => (
            <DataView
              items={filter(records)}
              columns={[...columns, statusColumn, editColumn]}
              renderCard={(r) => (
                <button
                  type="button"
                  onClick={() => setEditing(r)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div className="min-w-0">{renderCard(r)}</div>
                  {!r.isActive && <Badge>Inactive</Badge>}
                </button>
              )}
            />
          )}
        </QueryState>
      </Card>
      {editing !== undefined && (
        <MasterForm
          key={editing?.id ?? 'new'}
          name={name}
          entity={entity}
          fields={fields}
          records={list.data ?? []}
          editing={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}
