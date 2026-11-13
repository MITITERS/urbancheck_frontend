import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { isApiError } from '@/api/client'
import { AuthShell } from '@/components/common/AuthShell'
import { FormAlert } from '@/components/common/FormAlert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { PasswordField } from '@/components/common/PasswordField'
import { Input } from '@/components/ui/input'
import { messages } from '@/config/messages'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types/auth'
import { canAccessPath, homeRouteFor } from '@/routes/routeAccess'

const loginSchema = z.object({
  email: z.string().min(1, 'Ingresá tu correo.').email('El correo no es válido.'),
  password: z.string().min(1, 'Ingresá tu contraseña.'),
})

type LoginForm = z.infer<typeof loginSchema>

interface LocationState {
  from?: string
}

export function LoginPage() {
  const { status, user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (status === 'authenticated' && user) {
    return <Navigate to={destinationFor(user.role)} replace />
  }

  /**
   * A dónde mandar al usuario recién autenticado.
   *
   * El destino guardado por la guarda solo se respeta si el rol puede abrirlo:
   * si no, el usuario aterrizaría en «permisos insuficientes» por una URL que
   * quedó de una sesión anterior, que es exactamente lo que pasaba antes.
   */
  function destinationFor(role: Role): string {
    const from = (location.state as LocationState | null)?.from
    return from && canAccessPath(role, from) ? from : homeRouteFor(role)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      const signedIn = await login(values)
      navigate(destinationFor(signedIn.role), { replace: true })
    } catch (error) {
      setFormError(
        isApiError(error) && error.status === 400
          ? messages.auth.invalidCredentials
          : isApiError(error)
            ? error.message
            : messages.errors.unexpected,
      )
    }
  })

  return (
    <AuthShell title={messages.auth.loginTitle} description={messages.app.subtitle}>
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>{messages.auth.email}</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  autoComplete="username"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <PasswordField
            control={form.control}
            name="password"
            label={messages.auth.password}
          />
          {formError && <FormAlert message={formError} />}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? messages.auth.submitting
              : messages.auth.submit}
          </Button>
        </FieldGroup>
      </form>
    </AuthShell>
  )
}
