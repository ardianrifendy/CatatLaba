import { useEffect, useRef } from 'react'
import { turnstileSiteKey } from '@/lib/env'

interface CloudflareTurnstileProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
          theme?: 'auto' | 'light' | 'dark'
          size?: 'normal' | 'compact' | 'flexible'
        },
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
    onloadTurnstileCallback?: () => void
  }
}

export function CloudflareTurnstile({ onVerify, onExpire, onError }: CloudflareTurnstileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    // If site key is dummy or unset, do nothing
    if (!turnstileSiteKey || !containerRef.current) return

    let isMounted = true

    function renderWidget() {
      if (!window.turnstile || !containerRef.current || !isMounted) return
      try {
        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: turnstileSiteKey!,
          callback: (token: string) => {
            if (isMounted) onVerify(token)
          },
          'expired-callback': () => {
            if (isMounted && onExpire) onExpire()
          },
          'error-callback': () => {
            if (isMounted && onError) onError()
          },
          theme: 'auto',
          size: 'normal',
        })
      } catch {
        // Ignored
      }
    }

    const scriptId = 'cf-turnstile-script'
    let script = document.getElementById(scriptId) as HTMLScriptElement | null

    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback'
      script.async = true
      script.defer = true
      window.onloadTurnstileCallback = () => {
        renderWidget()
      }
      document.head.appendChild(script)
    } else if (window.turnstile) {
      renderWidget()
    } else {
      window.onloadTurnstileCallback = () => {
        renderWidget()
      }
    }

    return () => {
      isMounted = false
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // Ignored
        }
      }
    }
  }, [onVerify, onExpire, onError])

  if (!turnstileSiteKey) return null

  return (
    <div className="flex flex-col items-center justify-center my-2 min-h-[65px] w-full">
      <div ref={containerRef} className="w-full flex justify-center" />
    </div>
  )
}

