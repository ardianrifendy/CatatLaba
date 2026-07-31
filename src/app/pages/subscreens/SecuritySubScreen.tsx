import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Fingerprint, Check, Unlock, Lock, Grid, KeyRound, Delete, Shield } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassIconButton } from '@/components/ui/GlassIconButton'
import { GlassInput } from '@/components/ui/GlassInput'
import { GlassField } from '@/components/ui/GlassField'
import { useSecurityStore, type LockType } from '@/stores/security'
import { toast } from '@/stores/toast'

export function SecuritySubScreen({ onBack }: { onBack: () => void }) {
  const currentLockType = useSecurityStore((s) => s.lockType)
  const biometricEnabled = useSecurityStore((s) => s.biometricEnabled)
  const setLockConfig = useSecurityStore((s) => s.setLockConfig)
  const disableLock = useSecurityStore((s) => s.disableLock)

  const [selectedType, setSelectedType] = useState<LockType>(currentLockType)
  const [showSetupModal, setShowSetupModal] = useState(false)

  // Passcode Setup Flow State
  const [setupStep, setSetupStep] = useState<1 | 2>(1)
  const [pinLength, setPinLength] = useState<4 | 6>(4)
  const [firstPasscode, setFirstPasscode] = useState('')
  const [currentPinInput, setCurrentPinInput] = useState('')
  const [isShaking, setIsShaking] = useState(false)

  // Pattern Setup State
  const [patternDots, setPatternDots] = useState<number[]>([])
  const [isDrawingPattern, setIsDrawingPattern] = useState(false)

  // Password Setup State
  const [passwordInput, setPasswordInput] = useState('')
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('')

  function triggerShake() {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 450)
  }

  function handleSelectType(type: LockType) {
    if (type === 'none') {
      disableLock()
      setSelectedType('none')
      toast.success('Pengunci aplikasi telah dinonaktifkan.')
      return
    }
    setSelectedType(type)
    setSetupStep(1)
    setPinLength(4)
    setFirstPasscode('')
    setCurrentPinInput('')
    setPatternDots([])
    setPasswordInput('')
    setConfirmPasswordInput('')
    setShowSetupModal(true)
  }

  function handleSwitchPinLength(length: 4 | 6) {
    setPinLength(length)
    setSetupStep(1)
    setFirstPasscode('')
    setCurrentPinInput('')
  }

  // --- PIN CREATION LOGIC ---
  async function handlePinKey(digit: string) {
    if (currentPinInput.length >= pinLength) return
    const nextPin = currentPinInput + digit
    setCurrentPinInput(nextPin)

    if (nextPin.length === pinLength) {
      if (setupStep === 1) {
        setFirstPasscode(nextPin)
        setTimeout(() => {
          setSetupStep(2)
          setCurrentPinInput('')
        }, 150)
      } else {
        if (nextPin === firstPasscode) {
          await setLockConfig('pin', nextPin, biometricEnabled)
          setShowSetupModal(false)
          toast.success(`PIN Keamanan ${pinLength}-Digit berhasil disimpan!`)
        } else {
          triggerShake()
          toast.error('PIN tidak cocok. Silakan ulangi dari awal.')
          setSetupStep(1)
          setFirstPasscode('')
          setCurrentPinInput('')
        }
      }
    }
  }

  function handlePinBackspace() {
    setCurrentPinInput((p) => p.slice(0, -1))
  }

  // --- PATTERN CREATION LOGIC ---
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
    if (patternDots.length < 4) {
      triggerShake()
      toast.error('Pola terlalu pendek. Hubungkan minimal 4 titik.')
      setPatternDots([])
      return
    }

    const patternStr = patternDots.join('-')
    if (setupStep === 1) {
      setFirstPasscode(patternStr)
      setSetupStep(2)
      setPatternDots([])
      toast.success('Gambar ulang pola untuk konfirmasi')
    } else {
      if (patternStr === firstPasscode) {
        await setLockConfig('pattern', patternStr, biometricEnabled)
        setShowSetupModal(false)
        toast.success('Pola Kunci berhasil disimpan!')
      } else {
        triggerShake()
        toast.error('Pola tidak cocok. Silakan ulang pembuatan pola.')
        setSetupStep(1)
        setFirstPasscode('')
        setPatternDots([])
      }
    }
  }

  // --- PASSWORD CREATION LOGIC ---
  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordInput) {
      toast.error('Kata sandi tidak boleh kosong.')
      return
    }
    if (passwordInput !== confirmPasswordInput) {
      triggerShake()
      toast.error('Konfirmasi kata sandi tidak cocok.')
      return
    }
    await setLockConfig('password', passwordInput, biometricEnabled)
    setShowSetupModal(false)
    toast.success('Sandi Keamanan berhasil disimpan!')
  }

  async function handleToggleBiometric() {
    const nextBiometric = !biometricEnabled
    if (currentLockType === 'none') {
      toast.error('Aktifkan PIN atau Sandi terlebih dahulu sebelum menggunakan Biometrik.')
      return
    }
    await setLockConfig(currentLockType, '', nextBiometric)
    toast.success(nextBiometric ? 'Biometrik diaktifkan.' : 'Biometrik dinonaktifkan.')
  }

  return (
    <section className="flex flex-col gap-5 ios-page-enter">
      <div className="flex items-center gap-3">
        <GlassIconButton aria-label="Kembali" onClick={onBack}>
          <ArrowLeft aria-hidden className="size-5 text-foreground" />
        </GlassIconButton>
        <h2 className="flex-1 truncate text-lg font-bold tracking-tight text-foreground">
          Keamanan & Pengunci Aplikasi
        </h2>
      </div>

      {/* Lock Type Selection */}
      <div className="flex flex-col gap-2">
        <span className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Metode Kunci Aplikasi
        </span>
        <GlassCard className="divide-y divide-glass-border/60 overflow-hidden">
          {[
            { id: 'none' as LockType, label: 'Tanpa Kunci', desc: 'Aplikasi dapat langsung dibuka', icon: Unlock, iconBg: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/25' },
            { id: 'pin' as LockType, label: 'PIN (4 atau 6 Digit)', desc: 'Kunci tombol angka PIN cepat', icon: Lock, iconBg: 'bg-accent/15 text-accent border-accent/25' },
            { id: 'pattern' as LockType, label: 'Pola Matrix (Pattern)', desc: 'Geser pola 3×3 titik', icon: Grid, iconBg: 'bg-purple-500/15 text-purple-500 border-purple-500/25' },
            { id: 'password' as LockType, label: 'Sandi Teks (Password)', desc: 'Kunci sandi alfanumerik', icon: KeyRound, iconBg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25' },
          ].map((item) => {
            const isSelected = currentLockType === item.id
            const IconComponent = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectType(item.id)}
                className="ios-pressable flex w-full items-center justify-between p-4 text-left hover:bg-glass-hover"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${item.iconBg}`}>
                    <IconComponent className="size-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground block">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                  </div>
                </div>
                {isSelected && (
                  <span className="text-xs font-bold text-accent px-2.5 py-1 rounded-full bg-accent/15 border border-accent/25 flex items-center gap-1">
                    <Check className="size-3" />
                    Aktif
                  </span>
                )}
              </button>
            )
          })}
        </GlassCard>
      </div>

      {/* Biometric Toggle Card */}
      <div className="flex flex-col gap-2">
        <span className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Autentikasi Tambahan
        </span>
        <GlassCard className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/20">
              <Fingerprint className="size-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Sidik Jari / Biometrik</p>
              <p className="text-xs text-muted-foreground">Buka aplikasi secara cepat dengan biometrik HP</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleBiometric}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              biometricEnabled ? 'bg-accent' : 'bg-glass-border'
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                biometricEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </GlassCard>
      </div>

      {/* --- AUTHENTIC PORTALED iOS GLASS PASSCODE SETUP OVERLAY WITH ANIMATIONS --- */}
      {showSetupModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-2xl p-4 sheet-overlay" data-state="open">
            <div className="w-full max-w-[320px] p-6 flex flex-col items-center justify-center text-center gap-5 rounded-[32px] border border-glass-border/80 bg-background text-foreground shadow-2xl backdrop-blur-3xl dark:bg-card/95 border-white/20 ios-modal-pop">
              
              {/* Top Lock Badge */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-accent/20 text-accent border border-accent/30 shadow-md shadow-accent/20 animate-pulse">
                  <Shield className="size-7 text-accent" />
                </div>
                <h3 className="text-base font-extrabold text-foreground mt-1">
                  {selectedType === 'pin' && (setupStep === 1 ? `Buat PIN ${pinLength}-Digit` : 'Konfirmasi PIN')}
                  {selectedType === 'pattern' && (setupStep === 1 ? 'Gambar Pola Kunci' : 'Konfirmasi Pola')}
                  {selectedType === 'password' && 'Buat Sandi Teks'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  {selectedType === 'pin' && (setupStep === 1 ? `Masukkan ${pinLength} angka rahasia Anda` : 'Masukkan ulang PIN untuk konfirmasi')}
                  {selectedType === 'pattern' && (setupStep === 1 ? 'Hubungkan minimal 4 titik' : 'Gambar ulang pola untuk konfirmasi')}
                  {selectedType === 'password' && 'Masukkan kata sandi alfanumerik'}
                </p>
              </div>

              {/* 1. iOS GLASS PIN KEYPAD SETUP */}
              {selectedType === 'pin' && (
                <div className="flex flex-col items-center gap-5 w-full">
                  
                  {/* 4 vs 6 Digit Segmented Switcher */}
                  {setupStep === 1 && (
                    <div className="flex items-center gap-1 p-1 rounded-full bg-glass border border-glass-border">
                      <button
                        type="button"
                        onClick={() => handleSwitchPinLength(4)}
                        className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all duration-200 ${
                          pinLength === 4
                            ? 'bg-accent text-white shadow-sm shadow-accent/40 scale-105'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        4-Digit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchPinLength(6)}
                        className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all duration-200 ${
                          pinLength === 6
                            ? 'bg-accent text-white shadow-sm shadow-accent/40 scale-105'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        6-Digit
                      </button>
                    </div>
                  )}

                  {/* Animated Dots Indicator */}
                  <div className={`flex items-center justify-center gap-3 my-1 ${isShaking ? 'ios-shake' : ''}`}>
                    {Array.from({ length: pinLength }).map((_, idx) => {
                      const filled = currentPinInput.length > idx
                      return (
                        <div
                          key={idx}
                          className={`size-3.5 rounded-full border transition-all duration-200 ${
                            filled
                              ? 'bg-accent border-accent scale-125 shadow-lg shadow-accent/60'
                              : 'border-glass-border bg-glass/60'
                          }`}
                        />
                      )
                    })}
                  </div>

                  {/* Centered Glass 3x4 Keypad with Spring Feedback */}
                  <div className="grid grid-cols-3 gap-3.5 w-full max-w-[230px] justify-items-center">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handlePinKey(digit)}
                        className="ios-pressable flex size-15 items-center justify-center rounded-2xl border border-glass-border bg-glass/80 text-xl font-bold text-foreground shadow-sm hover:bg-glass-hover active:scale-90 active:bg-accent active:text-white transition-all duration-150"
                      >
                        {digit}
                      </button>
                    ))}

                    <div className="size-15" />

                    <button
                      type="button"
                      onClick={() => handlePinKey('0')}
                      className="ios-pressable flex size-15 items-center justify-center rounded-2xl border border-glass-border bg-glass/80 text-xl font-bold text-foreground shadow-sm hover:bg-glass-hover active:scale-90 active:bg-accent active:text-white transition-all duration-150"
                    >
                      0
                    </button>

                    <button
                      type="button"
                      onClick={handlePinBackspace}
                      className="ios-pressable flex size-15 items-center justify-center rounded-2xl border border-glass-border bg-glass/80 text-muted-foreground shadow-sm hover:bg-glass-hover hover:text-foreground active:scale-90 active:bg-accent/20 transition-all duration-150"
                    >
                      <Delete className="size-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* 2. iOS GLASS PATTERN SETUP WITH GLOW & SHAKE */}
              {selectedType === 'pattern' && (
                <div
                  className="flex flex-col items-center gap-4 w-full select-none touch-none"
                  onMouseUp={handlePatternTouchEnd}
                  onTouchEnd={handlePatternTouchEnd}
                  onTouchMove={handleTouchMove}
                >
                  <div className={`grid grid-cols-3 gap-5 p-5 rounded-3xl border border-glass-border bg-glass/40 shadow-inner ${isShaking ? 'ios-shake' : ''}`}>
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
                          className={`ios-pressable flex size-13 items-center justify-center rounded-full border transition-all duration-200 ${
                            isSelected
                              ? 'bg-accent border-accent scale-110 shadow-lg shadow-accent/60'
                              : 'border-glass-border bg-glass/60 hover:border-accent/40'
                          }`}
                        >
                          <div className={`size-3 rounded-full pointer-events-none transition-all duration-200 ${isSelected ? 'bg-white scale-125' : 'bg-muted-foreground/60'}`} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 3. iOS GLASS PASSWORD SETUP */}
              {selectedType === 'password' && (
                <form onSubmit={handlePasswordSave} className={`flex flex-col gap-3 w-full text-left ${isShaking ? 'ios-shake' : ''}`}>
                  <GlassField label="Kata Sandi Baru">
                    <GlassInput
                      type="password"
                      placeholder="Masukkan sandi..."
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      required
                    />
                  </GlassField>

                  <GlassField label="Konfirmasi Kata Sandi">
                    <GlassInput
                      type="password"
                      placeholder="Ulangi sandi..."
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      required
                    />
                  </GlassField>

                  <GlassButton type="submit" variant="primary" className="h-11 mt-2 font-semibold">
                    Simpan Sandi
                  </GlassButton>
                </form>
              )}

              {/* Cancel Button */}
              <GlassButton
                variant="ghost"
                onClick={() => setShowSetupModal(false)}
                className="w-full h-10 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-full hover:bg-glass-hover transition-colors"
              >
                Batal
              </GlassButton>

            </div>
          </div>,
          document.body
        )}
    </section>
  )
}
