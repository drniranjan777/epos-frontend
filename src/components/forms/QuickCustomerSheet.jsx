import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useSaveCustomer } from '../../hooks/useCustomers';
import { applyFieldErrors, getErrorMessage } from '../../utils/apiError';
import { emptyToNull } from '../../utils/formHelpers';
import { Button } from '../common/Button';
import { Sheet } from '../common/Sheet';
import { TextField } from './Field';

const schema = z.object({
  name: z.string().trim().min(1, 'Customer name is required').max(150),
  companyName: z.string().trim().max(150),
  mobile: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .refine((v) => !v || /^(\+91)?[6-9][0-9]{9}$/.test(v), 'Enter a valid 10-digit mobile number'),
  city: z.string().trim().max(100),
});

/**
 * Adds a customer without leaving the current screen (name, company, mobile, city).
 * GSTIN, state and addresses can be filled in later from Customers. Mount it when needed:
 * the form starts from `initialName` each time.
 */
export function QuickCustomerSheet({ initialName = '', onClose, onCreated }) {
  const save = useSaveCustomer();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: initialName, companyName: '', mobile: '', city: '' },
  });

  async function onSubmit(values) {
    try {
      const customer = await save.mutateAsync(emptyToNull(values));
      toast.success(`Customer added · ${customer.companyName || customer.name}`);
      onCreated(customer);
    } catch (error) {
      if (!applyFieldErrors(error, setError)) toast.error(getErrorMessage(error));
    }
  }

  const formId = 'quick-customer-form';
  return (
    <Sheet
      open
      onClose={onClose}
      title="New customer"
      description="GSTIN, state and address can be added later from Customers."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={isSubmitting}>
            Add customer
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <TextField
          label="Contact name"
          required
          data-autofocus
          register={register('name')}
          error={errors.name}
        />
        <TextField
          label="Company name"
          register={register('companyName')}
          error={errors.companyName}
        />
        <TextField
          label="Mobile"
          type="tel"
          inputMode="tel"
          register={register('mobile')}
          error={errors.mobile}
        />
        <TextField label="City" register={register('city')} error={errors.city} />
      </form>
    </Sheet>
  );
}
