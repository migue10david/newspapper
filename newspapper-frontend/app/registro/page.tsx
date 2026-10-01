'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthApiError, authClient } from '@/lib/auth-client';

const registrationSchema = z
  .object({
    email: z.string().email('Introduce un email válido.'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function RegistrationPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      await authClient.register({ email, password });
      router.replace('/admin/login?registered=1');
    } catch (error: unknown) {
      if (error instanceof AuthApiError && error.status === 409) {
        setError('email', { message: 'Este email ya está registrado.' });
        return;
      }

      setError('root', {
        message: 'No se pudo completar el registro. Inténtalo de nuevo.',
      });
    }
  });

  return (
    <section className="mx-auto grid min-h-[calc(100vh-14rem)] max-w-5xl items-center gap-10 py-10 lg:grid-cols-[1fr_400px]">
      <div className="hidden border-l-4 border-red-700 pl-8 lg:block">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-red-700">
          Comunidad del periódico
        </p>
        <h1 className="max-w-xl text-5xl font-black tracking-[-0.05em] text-zinc-950">
          Una mirada propia también cuenta.
        </h1>
        <p className="mt-6 max-w-md text-lg leading-8 text-zinc-600">
          Crea tu cuenta para formar parte de la comunidad editorial y comenzar a colaborar como autor.
        </p>
      </div>

      <div className="border border-zinc-200 bg-white p-6 shadow-[12px_12px_0_#991b1b] sm:p-8">
        <div className="mb-8 border-b border-zinc-200 pb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
            Periódico
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
            Crear cuenta
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Las cuentas nuevas comienzan con el rol de autor.
          </p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <FormField
            error={errors.email?.message}
            label="Email"
            registration={register('email')}
            type="email"
          />
          <FormField
            autoComplete="new-password"
            error={errors.password?.message}
            label="Contraseña"
            registration={register('password')}
            type="password"
          />
          <FormField
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            label="Confirmar contraseña"
            registration={register('confirmPassword')}
            type="password"
          />

          {errors.root?.message ? (
            <p className="border-l-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {errors.root.message}
            </p>
          ) : null}

          <button
            className="min-h-11 w-full rounded-md bg-brand px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Creando cuenta…' : 'Registrarme'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          ¿Ya tienes una cuenta?{' '}
          <Link className="font-semibold text-red-700 underline underline-offset-4" href="/admin/login">
            Inicia sesión
          </Link>
        </p>
      </div>
    </section>
  );
}

function FormField({
  autoComplete,
  error,
  label,
  registration,
  type,
}: {
  autoComplete?: string;
  error?: string;
  label: string;
  registration: UseFormRegisterReturn;
  type: 'email' | 'password';
}) {
  const inputId = label.toLowerCase().replaceAll(' ', '-');

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-zinc-800" htmlFor={inputId}>
        {label}
      </label>
      <input
        {...registration}
        aria-describedby={error ? `${inputId}-error` : undefined}
        aria-invalid={error ? 'true' : 'false'}
        autoComplete={autoComplete}
        className="min-h-11 w-full rounded-md border border-border bg-surface px-3 py-3 text-foreground transition"
        id={inputId}
        type={type}
      />
      {error ? (
        <p className="mt-1 text-sm text-red-700" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
