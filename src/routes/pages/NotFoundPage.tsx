import { Link } from 'react-router-dom'
import { MapPinOff } from 'lucide-react'
import { FullScreenMessage } from '@/components/common/FullScreenMessage'
import { Button } from '@/components/ui/button'
import { messages } from '@/config/messages'
import { useAuth } from '@/hooks/useAuth'
import { homeRouteFor } from '@/routes/routeAccess'

export function NotFoundPage() {
  const { role } = useAuth()

  return (
    <FullScreenMessage
      title={messages.notFound.title}
      description={messages.notFound.description}
      icon={<MapPinOff className="size-6" />}
    >
      <Button asChild variant="outline">
        <Link to={homeRouteFor(role)}>{messages.notFound.back}</Link>
      </Button>
    </FullScreenMessage>
  )
}
