import { useId } from 'react';
import { cn } from '../../utils/cn';

const controlBase =
  'block w-full rounded-lg border-0 bg-white px-3 text-slate-900 shadow-sm ring-1 ring-slate-300 ring-inset ' +
  'placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';

const invalid = 'ring-red-400 focus:ring-red-500';

/**
 * Label + control + hint/error. The control receives `id`, `aria-invalid` and
 * `aria-describedby` through the render prop so screen readers announce errors.
 */
export function Field({ label, error, hint, required, className, children }) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error?.message ?? error;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children({
        id,
        'aria-invalid': message ? true : undefined,
        'aria-describedby': message || hint ? messageId : undefined,
      })}
      {(message || hint) && (
        <p
          id={messageId}
          className={cn('mt-1 text-sm', message ? 'text-red-600' : 'text-slate-500')}
        >
          {message || hint}
        </p>
      )}
    </div>
  );
}

export function Input({ className, invalid: isInvalid, ...props }) {
  return <input className={cn(controlBase, 'h-11', isInvalid && invalid, className)} {...props} />;
}

export function Textarea({ className, invalid: isInvalid, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cn(controlBase, 'py-2.5', isInvalid && invalid, className)}
      {...props}
    />
  );
}

export function Select({ className, invalid: isInvalid, children, ...props }) {
  return (
    <select className={cn(controlBase, 'h-11 pr-8', isInvalid && invalid, className)} {...props}>
      {children}
    </select>
  );
}

/** Field + Input wired to react-hook-form `register`. */
export function TextField({ label, error, hint, required, className, register, ...inputProps }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(aria) => <Input {...aria} {...register} {...inputProps} invalid={Boolean(error)} />}
    </Field>
  );
}

export function TextAreaField({ label, error, hint, required, className, register, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(aria) => <Textarea {...aria} {...register} {...props} invalid={Boolean(error)} />}
    </Field>
  );
}

export function SelectField({
  label,
  error,
  hint,
  required,
  className,
  register,
  children,
  ...props
}) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(aria) => (
        <Select {...aria} {...register} {...props} invalid={Boolean(error)}>
          {children}
        </Select>
      )}
    </Field>
  );
}

export function Switch({ label, description, checked, onChange, disabled }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 py-1">
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description && <span className="block text-sm text-slate-500">{description}</span>}
      </span>
      <span className="relative inline-flex">
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="peer-focus-visible:ring-brand-500 h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-disabled:opacity-50" />
        <span className="absolute top-1 left-1 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
