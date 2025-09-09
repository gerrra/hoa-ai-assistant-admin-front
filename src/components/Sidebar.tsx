import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../shared/adminApi'

type SidebarProps = {
  isCollapsed: boolean
  isHidden: boolean
  onToggle: () => void
}

export default function Sidebar({ isCollapsed, isHidden, onToggle }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      id: 'documents',
      label: 'Документы',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      ),
      path: '/'
    },
    {
      id: 'communities',
      label: 'Сообщества',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      ),
      path: '/communities'
    },
    {
      id: 'logs',
      label: 'Логи',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      ),
      path: '/logs'
    }
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  if (isHidden) return null

  return (
    <div style={{
      width: isCollapsed ? 'auto' : '250px',
      minWidth: isCollapsed ? '60px' : '250px',
      height: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {!isCollapsed && (
          <div style={{ padding: '20px' }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: '700',
              color: 'var(--text-primary)'
            }}>
              HOA Admin
            </h1>
            <p style={{ 
              margin: '4px 0 0 0', 
              fontSize: '12px', 
              color: 'var(--text-muted)' 
            }}>
              Панель управления
            </p>
          </div>
        )}
        <button
          onClick={onToggle}
          style={{
            width: isCollapsed ? '100%' : 'auto',
            height: isCollapsed ? '100%' : '100%',
            aspectRatio: '1',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            borderRadius: '0',
            color: 'var(--text-muted)',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--surface-hover)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'none'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          {isCollapsed ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
          )}
        </button>
      </div>

      {/* Menu Items */}
      <nav style={{ flex: 1, padding: '0', display: 'flex', flexDirection: 'column' }}>
        {/* Main Menu Items */}
        <div style={{ flex: 1 }}>
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                height: '60px',
                background: isActive(item.path) ? 'var(--primary-light)' : 'transparent',
                color: isActive(item.path) ? 'var(--primary)' : 'var(--text-secondary)',
                border: 'none',
                padding: isCollapsed ? '12px' : '12px 20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: isCollapsed ? '0' : '12px',
                fontSize: '14px',
                fontWeight: isActive(item.path) ? '600' : '500',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                borderRadius: '0'
              }}
              onMouseOver={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = 'var(--surface-hover)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseOut={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'flex-start',
                minWidth: '20px',
                color: 'inherit',
                flexShrink: 0
              }}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span>{item.label}</span>
              )}
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={async () => {
            try {
              await logout()
              navigate('/login')
            } catch (err) {
              console.error('Logout error:', err)
              navigate('/login')
            }
          }}
          style={{
            width: '100%',
            height: '60px',
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: 'none',
            padding: isCollapsed ? '12px' : '12px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? '0' : '12px',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            textAlign: 'left',
            borderRadius: '0',
            borderTop: '1px solid var(--border)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--surface-hover)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <span style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-start',
            minWidth: '20px',
            color: 'inherit',
            flexShrink: 0
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          {!isCollapsed && (
            <span>Выйти</span>
          )}
        </button>
      </nav>

      {/* Footer */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'var(--primary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          fontWeight: '600',
          flexShrink: 0
        }}>
          A
        </div>
        {!isCollapsed && (
          <div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              Администратор
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--text-muted)' 
            }}>
              admin@hoa.com
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
