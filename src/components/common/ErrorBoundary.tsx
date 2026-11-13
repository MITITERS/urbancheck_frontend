import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertTriangle, WifiOff } from 'lucide-react'
import { FullScreenMessage } from '@/components/common/FullScreenMessage'
import { Button } from '@/components/ui/button'
import { messages } from '@/config/messages'

const t = messages.errorBoundary

/** Una pantalla diferida (`lazy`) cuyo archivo no llegó, casi siempre por la red. */
function isChunkLoadError(error: Error): boolean {
  return /dynamically imported module|Importing a module script failed|Loading chunk/i.test(
    error.message,
  )
}

function Fallback({
  error,
  fullScreen,
  onRetry,
}: {
  error: Error
  fullScreen: boolean
  onRetry: () => void
}) {
  const offline = !navigator.onLine || isChunkLoadError(error)
  const title = offline ? t.offlineTitle : t.title
  const description = offline ? t.offlineDescription : t.description
  const icon = offline ? (
    <WifiOff className="size-6" />
  ) : (
    <AlertTriangle className="size-6" />
  )
  const retry = <Button onClick={onRetry}>{t.retry}</Button>

  if (fullScreen) {
    return (
      <FullScreenMessage
        title={title}
        description={description}
        icon={icon}
        tone="destructive"
      >
        {retry}
      </FullScreenMessage>
    )
  }
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
      <span
        aria-hidden
        className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
      >
        {icon}
      </span>
      <div className="space-y-2">
        <h1 className="font-heading text-xl font-semibold">{title}</h1>
        <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
      </div>
      {retry}
    </div>
  )
}

interface BoundaryProps {
  children: ReactNode
  /** Cambiarla limpia el error: navegar a otra pantalla no hereda la caída. */
  resetKey: string
  fullScreen: boolean
}

interface BoundaryState {
  error: Error | null
  resetKey: string
}

class Boundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null, resetKey: this.props.resetKey }

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return { error }
  }

  static getDerivedStateFromProps(
    props: BoundaryProps,
    state: BoundaryState,
  ): Partial<BoundaryState> | null {
    return props.resetKey === state.resetKey
      ? null
      : { error: null, resetKey: props.resetKey }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error de renderizado', error, info.componentStack)
  }

  retry = () => {
    // Una pantalla diferida que no llegó queda cacheada como fallida: solo
    // recargando se vuelve a pedir.
    if (this.state.error && isChunkLoadError(this.state.error)) {
      window.location.reload()
      return
    }
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <Fallback
          error={this.state.error}
          fullScreen={this.props.fullScreen}
          onRetry={this.retry}
        />
      )
    }
    return this.props.children
  }
}

/**
 * N-19 — un error de renderizado, o una pantalla diferida que no llega sin
 * conexión, dejaba el panel en blanco. Esto lo reemplaza por un mensaje y un
 * botón para reintentar. Va en la raíz (`fullScreen`) y alrededor del
 * contenido del layout, para que el menú siga a mano.
 */
export function RouteErrorBoundary({
  children,
  fullScreen = false,
}: {
  children: ReactNode
  fullScreen?: boolean
}) {
  const { pathname } = useLocation()
  return (
    <Boundary resetKey={pathname} fullScreen={fullScreen}>
      {children}
    </Boundary>
  )
}
