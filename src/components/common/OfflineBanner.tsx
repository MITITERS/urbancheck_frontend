import { WifiOff } from 'lucide-react'
import { messages } from '@/config/messages'
import { useOnline } from '@/hooks/useOnline'

/** El aviso fijo de que se cortó la red (N-19). Sin él, el panel no lo decía. */
export function OfflineBanner() {
  const online = useOnline()
  if (online) return null

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-sm font-medium text-white"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden />
      {messages.offline.banner}
    </div>
  )
}
