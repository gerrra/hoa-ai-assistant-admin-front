import React, { useEffect, useState } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

type ToastProps = {
  message: string
  type: ToastType
  duration?: number
  onClose: () => void
}

export default function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300) // Wait for animation to complete
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getToastStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      bottom: '20px',
      right: '20px',
      padding: '16px 20px',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 9999,
      maxWidth: '400px',
      transform: visible ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer'
    }

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          background: '#d1fae5',
          color: '#065f46',
          border: '1px solid #a7f3d0'
        }
      case 'error':
        return {
          ...baseStyles,
          background: '#fee2e2',
          color: '#991b1b',
          border: '1px solid #fca5a5'
        }
      case 'warning':
        return {
          ...baseStyles,
          background: '#fef3c7',
          color: '#92400e',
          border: '1px solid #fde68a'
        }
      case 'info':
        return {
          ...baseStyles,
          background: '#dbeafe',
          color: '#1e40af',
          border: '1px solid #93c5fd'
        }
      default:
        return baseStyles
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return 'ℹ️'
    }
  }

  return (
    <div style={getToastStyles()} onClick={onClose}>
      <span style={{ fontSize: '16px' }}>{getIcon()}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setVisible(false)
          setTimeout(onClose, 300)
        }}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '18px',
          cursor: 'pointer',
          color: 'inherit',
          opacity: 0.7,
          padding: '0',
          marginLeft: '8px'
        }}
      >
        ×
      </button>
    </div>
  )
}

// Toast manager hook
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType; duration?: number }>>([])

  const addToast = (message: string, type: ToastType = 'info', duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type, duration }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const ToastContainer = () => (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )

  return { addToast, ToastContainer }
}
