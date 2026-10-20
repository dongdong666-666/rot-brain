import { useCallback, useEffect, useRef, useState } from 'react'

export type ToastKind = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

const ICONS: Record<ToastKind, string> = {
  success: '✅',
  error: '⚠️',
  info: 'ℹ️',
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)
  const timers = useRef<number[]>([])

  const notify = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++idRef.current
    setToasts((prev) => [...prev.slice(-2), { id, kind, message }])
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2600)
    timers.current.push(timer)
  }, [])

  useEffect(() => {
    const list = timers.current
    return () => {
      list.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  return { toasts, notify }
}

export function ToastHost({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`}>
          <span className="toast__icon">{ICONS[t.kind]}</span>
          <span className="toast__text">{t.message}</span>
        </div>
      ))}
    </div>
  )
}
