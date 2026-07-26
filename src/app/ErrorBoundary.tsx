import { Component, type ErrorInfo, type ReactNode } from 'react'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { commonText } from '@/lib/ui-text'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Label included in the console.error log to identify where the crash happened. */
  context?: string
}

interface ErrorBoundaryState {
  hasError: boolean
}

// Catches render crashes below it and shows a glass error card instead of a
// white screen (DESIGN.md resilience). The shell wraps every page in one of
// these, keyed by tab, so a crash on one page never takes down the shell.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error(
      `[${this.props.context ?? 'ErrorBoundary'}] render crashed:`,
      error,
      info.componentStack,
    )
  }

  private readonly reset = (): void => {
    this.setState({ hasError: false })
  }

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex w-full justify-center py-10">
        <GlassCard className="w-full max-w-sm p-6 text-center">
          <h2 className="text-lg font-semibold tracking-tight">
            {commonText.errorBoundary.title}
          </h2>
          <p className="mt-2 text-sm font-light text-zinc-400">
            {commonText.errorBoundary.description}
          </p>
          <GlassButton variant="ghost" className="mt-5" onClick={this.reset}>
            {commonText.actions.retry}
          </GlassButton>
        </GlassCard>
      </div>
    )
  }
}
