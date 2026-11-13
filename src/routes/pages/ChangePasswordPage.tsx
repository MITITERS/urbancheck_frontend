import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { changePassword } from '@/api/auth'
import { isApiError } from '@/api/client'
import { AuthShell } from '@/components/common/AuthShell'
import { FormAlert } from '@/components/common/FormAlert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { PasswordField } from '@/components/common/PasswordField'
import { messages } from '@/config/messages'
import { useAuth } from '@/hooks/useAuth'
import { homeRouteFor } from '@/routes/routeAccess'

const MIN_PASSWORD_LENGTH = 8

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresá tu contraseña actual.'),
    newPassword: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Usá al menos ${MIN_PASSWORD_LENGTH} caracteres.`),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  })

type ChangePasswordForm = z.infer<typeof schema>

/**
 * Forced password change on first sign-in. It lives outside the app shell on
 * purpose: until the temporary password is replaced, no other screen is
 * reachable (see `ProtectedRoute`).
 */
export function ChangePasswordPage() {
  const { mustChangePassword, refreshUser, role } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  if (!mustChangePassword) {
    return <Navigate to={homeRouteFor(role)} replace />
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      await changePassword(values.currentPassword, values.newPassword)
      await refreshUser()
      toast.success('Tu contraseña fue actualizada.')
      navigate(homeRouteFor(role), { replace: true })
    } catch (error) {
      setFormError(isApiError(error) ? error.message : messages.errors.unexpected)
    }
  })

  const fields = [
    { name: 'currentPassword', label: messages.changePassword.currentPassword },
    { name: 'newPassword', label: messages.changePassword.newPassword },
    { name: 'confirmPassword', label: messages.changePassword.confirmPassword },
  ] as const

  return (
    <AuthShell
      title={messages.changePassword.title}
      description={messages.changePassword.description}
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          {fields.map(({ name, label }) => (
            <PasswordField
              key={name}
              control={form.control}
              name={name}
              label={label}
              autoComplete="new-password"
            />
          ))}
          {formError && <FormAlert message={formError} />}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {messages.changePassword.submit}
          </Button>
        </FieldGroup>
      </form>
    </AuthShell>
  )
}
