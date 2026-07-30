import type { SVGProps } from 'react'

export type IosIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string
}

// Helper to determine SVG width and height attributes
function getSvgDimensions(size?: number | string) {
  if (typeof size === 'number') return { width: size, height: size }
  if (typeof size === 'string') return { width: size, height: size }
  return { width: 22, height: 22 }
}

// iOS 26 Premium Glassmorphic Icons with ultra-crisp strokes and vector scaling

export function IosHomeIcon({ size, className = '', ...props }: IosIconProps) {
  const dims = getSvgDimensions(size)
  return (
    <svg
      {...dims}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="ios-home-grad" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path
        d="M3.75 10.5L11.0858 3.16421C11.5909 2.65914 12.4091 2.65914 12.9142 3.16421L20.25 10.5V19.25C20.25 20.2165 19.4665 21 18.5 21H15.25V14.75C15.25 14.0596 14.6904 13.5 14 13.5H10C9.30964 13.5 8.75 14.0596 8.75 14.75V21H5.5C4.5335 21 3.75 20.2165 3.75 19.25V10.5Z"
        fill="url(#ios-home-grad)"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IosReceiptIcon({ size, className = '', ...props }: IosIconProps) {
  const dims = getSvgDimensions(size)
  return (
    <svg
      {...dims}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="ios-receipt-grad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path
        d="M4.75 3.75C4.75 2.7835 5.5335 2 6.5 2H17.5C18.4665 2 19.25 2.7835 19.25 3.75V21.25L16.25 19.25L13.75 21.25L12 19.75L10.25 21.25L7.75 19.25L4.75 21.25V3.75Z"
        fill="url(#ios-receipt-grad)"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 7.5H15.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M8.5 11.5H15.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M8.5 15.5H12.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function IosPackageIcon({ size, className = '', ...props }: IosIconProps) {
  const dims = getSvgDimensions(size)
  return (
    <svg
      {...dims}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="ios-pkg-grad" x1="3" y1="4" x2="21" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.75L20.5 7.25V16.75L12 21.25L3.5 16.75V7.25L12 2.75Z"
        fill="url(#ios-pkg-grad)"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 2.75V21.25" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M20.5 7.25L12 12L3.5 7.25" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function IosChartIcon({ size, className = '', ...props }: IosIconProps) {
  const dims = getSvgDimensions(size)
  return (
    <svg
      {...dims}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      {...props}
    >
      <rect x="3.75" y="13.75" width="4" height="6.5" rx="1.25" stroke="currentColor" strokeWidth="1.75" />
      <rect x="10" y="8.75" width="4" height="11.5" rx="1.25" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.75" />
      <rect x="16.25" y="4.25" width="4" height="16" rx="1.25" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.75" />
      <path d="M2.5 21H21.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function IosSettingsIcon({ size, className = '', ...props }: IosIconProps) {
  const dims = getSvgDimensions(size)
  return (
    <svg
      {...dims}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      {...props}
    >
      <circle cx="12" cy="12" r="3.25" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IosWalletIcon({ size, className = '', ...props }: IosIconProps) {
  const dims = getSvgDimensions(size)
  return (
    <svg
      {...dims}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      {...props}
    >
      <rect x="2.75" y="6.25" width="18.5" height="13.5" rx="3" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.75" />
      <path d="M2.75 9.75H21.25" stroke="currentColor" strokeWidth="1.75" />
      <path d="M15.5 13.5H17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 3.75L18 3.75" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

export function IosScaleIcon({ size, className = '', ...props }: IosIconProps) {
  const dims = getSvgDimensions(size)
  return (
    <svg
      {...dims}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      {...props}
    >
      <path d="M12 3V21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M4 7H20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M4 7L2 13C2 14.6569 4.23858 16 7 16C9.76142 16 12 14.6569 12 13L4 7Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M20 7L12 13C12 14.6569 14.2386 16 17 16C19.7614 16 22 14.6569 22 13L20 7Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M8 21H16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function IosArrowUpCircleIcon({ size, className = '', ...props }: IosIconProps) {
  const dims = getSvgDimensions(size)
  return (
    <svg
      {...dims}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      {...props}
    >
      <circle cx="12" cy="12" r="9.25" fill="#30D158" fillOpacity="0.18" stroke="#30D158" strokeWidth="1.75" />
      <path d="M12 16.25V7.75" stroke="#30D158" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.25 11.5L12 7.75L15.75 11.5" stroke="#30D158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IosArrowDownCircleIcon({ size, className = '', ...props }: IosIconProps) {
  const dims = getSvgDimensions(size)
  return (
    <svg
      {...dims}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      {...props}
    >
      <circle cx="12" cy="12" r="9.25" fill="#FF453A" fillOpacity="0.18" stroke="#FF453A" strokeWidth="1.75" />
      <path d="M12 7.75V16.25" stroke="#FF453A" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.25 12.5L12 16.25L15.75 12.5" stroke="#FF453A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IosTargetIcon({ size, className = '', ...props }: IosIconProps) {
  const dims = getSvgDimensions(size)
  return (
    <svg
      {...dims}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      {...props}
    >
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="5.25" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="1.75" fill="currentColor" />
    </svg>
  )
}
