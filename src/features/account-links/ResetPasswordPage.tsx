import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { isApiError } from '@/api/client'
import { AuthShell } from '@/components/common/AuthShell'
import { FormAlert } from '@/components/common/FormAlert'
import { PasswordField } from '@/components/common/PasswordField'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { LOGIN_ROUTE } from '@/config/constants'
import { messages } from '@/config/messages'
import { resetPassword } from './api'

const t = messages.accountLinks
const MIN_PASSWORD_LENGTH = 8

const schema = z
  .object({
    newPassword: z.string().min(MIN_PASSWORD_LENGTH, t.minLength(MIN_PASSWORD_LENGTH)),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: t.mismatch,
  })

type ResetPasswordForm = z.infer<typeof schema>

/**
 * N-16 — la recuperación de contraseña desde el navegador.
 *
 * Llega acá quien abre el enlace del correo sin la app instalada:
 * `/reset-password` del backend redirige a esta página con la misma clave. Es
 * pública, como `/reporte/:token`, y reemplaza a la página HTML de allauth.
 */
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const key = params.get('key') ?? ''
  const [formError, setFormError] = useState<string | null>(key ? null : t.invalidLink)
  const [done, setDone] = useState(false)

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      await resetPassword(key, values.newPassword)
      setDone(true)
    } catch (error) {
      setFormError(isApiError(error) ? error.message : messages.errors.unexpected)
    }
  })

  if (done) {
    return (
      <AuthShell title={t.resetTitle} description={t.resetDone}>
        <Button asChild size="lg" className="w-full">
          <Link to={LOGIN_ROUTE}>{t.goToLogin}</Link>
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t.resetTitle} description={t.resetDescription}>
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <PasswordField
            control={form.control}
            name="newPassword"
            label={t.newPassword}
            autoComplete="new-password"
          />
          <PasswordField
            control={form.control}
            name="confirmPassword"
            label={t.confirmPassword}
            autoComplete="new-password"
          />
          {formError && <FormAlert message={formError} />}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!key || form.formState.isSubmitting}
          >
            {t.resetSubmit}
          </Button>
        </FieldGroup>
      </form>
    </AuthShell>
  )
}
