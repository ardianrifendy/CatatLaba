import { useState, useEffect } from 'react'
import { Delete, Fingerprint, Lock, HelpCircle } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassInput } from '@/components/ui/GlassInput'
import { useSecurityStore } from '@/stores/security'
import { toast } from '@/stores/toast'

export function AppLockOverlay() {
  const isLocked = useSecurityStore((s) => s.isLocked)
  const lockType = useSecurityStore((s) => s.lockType)
  const biometricEnabled = useSecurityStore((s) => s.biometricEnabled)
  const recoveryQuestion = useSecurityStore((s) => s.recoveryQuestion)
  const recoveryAnswerHash = useSecurityStore((s) => s.recoveryAnswerHash)
  const unlockWithSecret = useSecurityStore((s) => s.unlockWithSecret)
  const unlockWithBiometrics = useSecurityStore((s) => s.unlockWithBiometrics)
  const verifyRecoveryAnswer = useSecurityStore((s) => s.verifyRecoveryAnswer)
  const disableLock = useSecurityStore((s) => s.disableLock)

  // PIN state
  const [pinInput, setPinInput] = useState('')

  // Pattern state (3x3 grid dots 1..9)
  const [patternDots, setPatternDots] = useState<number[]>([])
  const [isDrawingPattern, setIsDrawingPattern] = useState(false)

  // Password state
  const [passwordInput, setPasswordInput] = useState('')

  // Reset confirmation / recovery state
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [recoveryAnswerInput, setRecoveryAnswerInput] = useState('')

  // Auto trigger biometrics on mount if enabled
  useEffect(() => {
    if (isLocked && biometricEnabled) {
      handleBiometricUnlock()
    }
  }, [isLocked, biometricEnabled])

  if (!isLocked || lockType === 'none') return null

  // --- PIN KEYPAD HANDLER ---
  async function handlePinDigit(digit: string) {
    if (pinInput.length >= 6) return
    const nextPin = pinInput + digit
    setPinInput(nextPin)

    // Verify when reaches 4 digits (or 6 digits)
    if (nextPin.length >= 4) {
      const ok = await unlockWithSecret(nextPin)
      if (!ok && nextPin.length >= 6) {
        toast.error('PIN salah. Silakan coba lagi.')
        setPinInput('')
      }
    }
  }

  function handlePinBackspace() {
    setPinInput((p) => p.slice(0, -1))
  }

  // --- PATTERN 3x3 MATRIX HANDLER ---
  function handlePatternTouchStart(dotId: number) {
    setIsDrawingPattern(true)
    setPatternDots([dotId])
  }

  function handlePatternTouchMove(dotId: number) {
    if (!isDrawingPattern) return
    if (!patternDots.includes(dotId)) {
      setPatternDots((prev) => [...prev, dotId])
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDrawingPattern) return
    const touch = e.touches[0]
    if (!touch) return
    const target = document.elementFromPoint(touch.clientX, touch.clientY)
    if (target) {
      const dotBtn = target.closest('[data-dot-id]')
      if (dotBtn) {
        const dotId = Number(dotBtn.getAttribute('data-dot-id'))
        if (dotId && !patternDots.includes(dotId)) {
          setPatternDots((prev) => [...prev, dotId])
        }
      }
    }
  }

  async function handlePatternTouchEnd() {
    if (!isDrawingPattern) return
    setIsDrawingPattern(false)
    if (patternDots.length === 0) return

    const patternString = patternDots.join('-')
    const ok = await unlockWithSecret(patternString)
    if (!ok) {
      toast.error('Pola salah. Silakan coba lagi.')
    }
    setPatternDots([])
  }

  // --- PASSWORD HANDLER ---
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ok = await unlockWithSecret(passwordInput)
    if (!ok) {
      toast.error('Sandi salah. Silakan coba lagi.')
      setPasswordInput('')
    }
  }

  // --- BIOMETRIC HANDLER ---
  function handleBiometricUnlock() {
    const ok = unlockWithBiometrics()
    if (ok) {
      toast.success('Buka kunci dengan Biometrik berhasil!')
    } else {
      toast.error('Biometrik gagal atau belum terverifikasi.')
    }
  }

  // --- RECOVERY ANSWER VERIFICATION ---
  async function handleVerifyRecovery(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!recoveryAnswerInput.trim()) {
      toast.error('Masukkan jawaban pemulihan Anda.')
      return
    }
    const ok = await verifyRecoveryAnswer(recoveryAnswerInput)
    if (ok) {
      setShowResetConfirm(false)
      setRecoveryAnswerInput('')
      toast.success('Jawaban pemulihan benar. Pengunci aplikasi telah dinonaktifkan!')
    } else {
      toast.error('Jawaban pemulihan salah. Silakan coba lagi.')
    }
  }

  // --- EMERGENCY RESET LOCK ---
  function handleResetSecurity() {
    disableLock()
    setShowResetConfirm(false)
    toast.success('Pengunci aplikasi telah dinonaktifkan.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-3xl p-6 ios-page-enter">
      <GlassCard className="w-full max-w-sm p-8 flex flex-col items-center text-center gap-6 border-glass-border/80 shadow-2xl backdrop-blur-2xl bg-glass-strong">
        {/* Top Lock Badge */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-16 items-center justify-center rounded-3xl bg-accent/20 text-accent border border-accent/30 shadow-lg shadow-accent/20">
            <Lock className="size-8 text-accent animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">CatatLaba Locked</h2>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              {lockType === 'pin' && 'Masukkan PIN untuk membuka aplikasi'}
              {lockType === 'pattern' && 'Hubungkan Pola untuk membuka aplikasi'}
              {lockType === 'password' && 'Masukkan Sandi untuk membuka aplikasi'}
            </p>
          </div>
        </div>

        {/* 1. PIN KEYPAD INTERFACE */}
        {lockType === 'pin' && (
          <div className="flex flex-col items-center gap-6 w-full">
            {/* PIN Indicators */}
            <div className="flex items-center justify-center gap-3 my-2">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pinInput.length > idx
                return (
                  <div
                    key={idx}
                    className={`size-4 rounded-full border transition-all duration-200 ${
                      filled
                        ? 'bg-accent border-accent scale-110 shadow-md shadow-accent/50'
                        : 'border-glass-border bg-glass'
                    }`}
                  />
                )
              })}
            </div>

            {/* Keypad 3x4 Grid */}
            <div className="grid grid-cols-3 gap-3.5 w-full max-w-[240px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinDigit(digit)}
                  className="ios-pressable flex size-16 items-center justify-center rounded-2xl border border-glass-border bg-glass/80 text-xl font-bold text-foreground shadow-sm hover:bg-glass-hover active:scale-95 transition-all"
                >
                  {digit}
                </button>
              ))}

              {biometricEnabled ? (
                <button
                  type="button"
                  onClick={handleBiometricUnlock}
                  className="ios-pressable flex size-16 items-center justify-center rounded-2xl border border-accent/30 bg-accent/15 text-accent shadow-sm hover:bg-accent/25 active:scale-95 transition-all"
                >
                  <Fingerprint className="size-6" />
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                className="ios-pressable flex size-16 items-center justify-center rounded-2xl border border-glass-border bg-glass/80 text-xl font-bold text-foreground shadow-sm hover:bg-glass-hover active:scale-95 transition-all"
              >
                0
              </button>

              <button
                type="button"
                onClick={handlePinBackspace}
                className="ios-pressable flex size-16 items-center justify-center rounded-2xl border border-glass-border bg-glass/80 text-muted-foreground shadow-sm hover:bg-glass-hover hover:text-foreground active:scale-95 transition-all"
              >
                <Delete className="size-5" />
              </button>
            </div>
          </div>
        )}

        {/* 2. PATTERN 3x3 GRID INTERFACE */}
        {lockType === 'pattern' && (
          <div
            className="flex flex-col items-center gap-4 w-full select-none touch-none"
            onMouseUp={handlePatternTouchEnd}
            onTouchEnd={handlePatternTouchEnd}
            onTouchMove={handleTouchMove}
          >
            <div className="grid grid-cols-3 gap-6 p-4 rounded-3xl border border-glass-border bg-glass/60">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((dot) => {
                const isSelected = patternDots.includes(dot)
                return (
                  <button
                    key={dot}
                    type="button"
                    data-dot-id={dot}
                    onMouseDown={() => handlePatternTouchStart(dot)}
                    onMouseEnter={() => handlePatternTouchMove(dot)}
                    onTouchStart={() => handlePatternTouchStart(dot)}
                    className={`ios-pressable flex size-14 items-center justify-center rounded-full border transition-all duration-200 ${
                      isSelected
                        ? 'bg-accent border-accent scale-110 shadow-lg shadow-accent/50'
                        : 'border-glass-border bg-glass hover:border-accent/40'
                    }`}
                  >
                    <div className={`size-3 rounded-full pointer-events-none transition-all duration-200 ${isSelected ? 'bg-white scale-125' : 'bg-muted-foreground/60'}`} />
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">Geser jari untuk menyambungkan titik pola</p>
          </div>
        )}

        {/* 3. PASSWORD FORM INTERFACE */}
        {lockType === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3 w-full">
            <GlassInput
              type="password"
              placeholder="Masukkan kata sandi..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
              className="h-12 text-center text-base tracking-widest"
            />
            <GlassButton type="submit" variant="primary" className="h-11 font-semibold">
              Buka Kunci
            </GlassButton>
          </form>
        )}

        {/* Emergency Reset / Recovery Option */}
        <div className="flex flex-col gap-2 w-full pt-2 border-t border-glass-border/40">
          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Lupa Passcode / Reset Pengunci?
            </button>
          ) : recoveryQuestion && recoveryAnswerHash ? (
            /* Recovery Question Challenge Form */
            <form onSubmit={handleVerifyRecovery} className="flex flex-col gap-3 p-3.5 rounded-2xl bg-glass/80 border border-glass-border text-left">
              <div className="flex items-center gap-1.5 text-accent">
                <HelpCircle className="size-4 shrink-0" />
                <p className="text-xs font-bold text-foreground">Pemulihan Kunci Keamanan</p>
              </div>
              <p className="text-xs font-semibold text-foreground leading-snug">
                {recoveryQuestion}
              </p>
              <GlassInput
                type="text"
                placeholder="Masukkan jawaban Anda..."
                value={recoveryAnswerInput}
                onChange={(e) => setRecoveryAnswerInput(e.target.value)}
                autoFocus
                className="h-10 text-xs"
              />
              <div className="flex items-center gap-2 mt-1">
                <GlassButton
                  variant="ghost"
                  onClick={() => {
                    setShowResetConfirm(false)
                    setRecoveryAnswerInput('')
                  }}
                  className="flex-1 h-9 text-xs"
                >
                  Batal
                </GlassButton>
                <GlassButton
                  variant="primary"
                  type="submit"
                  className="flex-1 h-9 text-xs font-bold"
                >
                  Verifikasi
                </GlassButton>
              </div>
            </form>
          ) : (
            /* Emergency Reset Confirmation (High Contrast Danger Button) */
            <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-expense/10 border border-expense/25 text-left">
              <p className="text-xs text-foreground font-semibold">Reset Kunci Keamanan?</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Kunci aplikasi akan dinonaktifkan tanpa menghapus data keuangan Anda.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <GlassButton
                  variant="ghost"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 h-9 text-xs font-medium"
                >
                  Batal
                </GlassButton>
                <GlassButton
                  variant="danger"
                  onClick={handleResetSecurity}
                  className="flex-1 h-9 text-xs font-bold shadow-sm"
                >
                  Reset Kunci
                </GlassButton>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
