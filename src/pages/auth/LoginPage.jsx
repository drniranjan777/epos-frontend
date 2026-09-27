import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router';
import { z } from 'zod';
import { Button } from '../../components/common/Button';
import { TextField } from '../../components/forms/Field';
import { APP_NAME } from '../../constants/app';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/apiError';

const schema = z.object({
  login: z.string().trim().min(1, 'Enter your username'),
  password: z.string().min(1, 'Enter your password'),
});

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { login: '', password: '' } });

  async function onSubmit(values) {
    setFormError(null);
    try {
      await login(values);
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-900 sm:items-center sm:justify-center sm:p-6">
      <div className="pt-safe flex flex-col items-center px-6 pt-14 pb-10 text-center sm:pt-0">
        <img src="/icon.svg" alt="" className="size-14" />
        <h1 className="mt-4 text-2xl font-bold text-white">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-slate-400">Sign in to manage stock and invoices</p>
      </div>

      <div className="pb-safe flex-1 rounded-t-3xl bg-white px-6 pt-8 sm:w-full sm:max-w-sm sm:flex-none sm:rounded-2xl sm:pb-8 sm:shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 ring-1 ring-red-200"
            >
              {formError}
            </div>
          )}
          <TextField
            label="Username or email"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            autoFocus
            register={register('login')}
            error={errors.login}
          />
          <div className="relative">
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="[&_input]:pr-12"
              register={register('password')}
              error={errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-7 right-1 rounded-lg p-2.5 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
