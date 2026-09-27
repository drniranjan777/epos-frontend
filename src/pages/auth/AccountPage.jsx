import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { PageHeader } from '../../components/common/PageHeader';
import { TextField } from '../../components/forms/Field';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { applyFieldErrors, getErrorMessage } from '../../utils/apiError';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Za-z]/, 'Must contain a letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export function AccountPage() {
  const { user, clearSession } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit({ currentPassword, newPassword }) {
    try {
      await authService.changePassword({ currentPassword, newPassword });
      toast.success('Password changed. Please sign in again.');
      clearSession();
    } catch (error) {
      if (!applyFieldErrors(error, setError)) toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="My account" subtitle={`${user.name} · ${user.roleName}`} />
      <Card className="p-4">
        <h2 className="mb-4 font-semibold">Change password</h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <TextField
            label="Current password"
            type="password"
            autoComplete="current-password"
            register={register('currentPassword')}
            error={errors.currentPassword}
          />
          <TextField
            label="New password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters with a letter and a number"
            register={register('newPassword')}
            error={errors.newPassword}
          />
          <TextField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            register={register('confirmPassword')}
            error={errors.confirmPassword}
          />
          <Button type="submit" fullWidth loading={isSubmitting}>
            Update password
          </Button>
        </form>
      </Card>
    </div>
  );
}
