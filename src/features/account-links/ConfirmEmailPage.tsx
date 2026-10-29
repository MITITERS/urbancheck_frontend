import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { isApiError } from '@/api/client'
import { AuthShell } from '@/components/common/AuthShell'
import { FormAlert } from '@/components/common/FormAlert'
import { messages } from '@/config/messages'
import { domainKeys } from '@/lib/queryKeys'
import { verifyEmail } from './api'

const t = messages.accountLinks
const confirmEmailKeys = domainKeys('confirmar-correo')

/**
 * N-16 — la confirmación de correo, a la que lleva el enlace del correo de
 * alta. Es pública y confirma sola al abrirse: no hay nada que completar.
 */
export function ConfirmEmailPage() {
  const [params] = useSearchParams()
  const key = params.get('key') ?? ''
  // Una sola vez por clave: la clave deja de valer en cuanto se usa.
  const query = useQuery({
    queryKey: confirmEmailKeys.detail(key),
    queryFn: async () => {
      await verifyEmail(key)
      return true
    },
    enabled: key !== '',
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  if (!key || query.isError) {
    const message = key && isApiError(query.error) ? query.error.message : t.invalidLink
    return (
      <AuthShell title={t.confirmTitle} description="">
        <FormAlert message={message} />
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t.confirmTitle}
      description={query.isSuccess ? t.confirmDone : t.confirming}
    >
      {query.isSuccess && (
        <p className="text-center text-sm text-muted-foreground">{t.continueHint}</p>
      )}
    </AuthShell>
  )
}
