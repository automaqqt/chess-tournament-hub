"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: '#27272a', // zinc-800
          border: '1px solid #3f3f46', // zinc-700
          color: '#fafafa', // zinc-50
        },
        classNames: {
          error: 'toast-error',
          success: 'toast-success',
          info: 'toast-info',
        },
      }}
      style={{
        '--toast-error-bg': '#dc2626', // red-600
        '--toast-error-text': '#fafafa', // white
        '--toast-success-bg': '#16a34a', // green-600
        '--toast-success-text': '#fafafa', // white
        '--toast-info-bg': '#d4af37', // primary gold
        '--toast-info-text': '#1a1a1a', // dark text
      } as React.CSSProperties}
      {...props}
    />
  )
}

export { Toaster }
