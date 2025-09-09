import React, { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import DocumentsPage from '../pages/DocumentsPage'
import CommunitiesPage from '../pages/CommunitiesPage'
import LogsPage from '../pages/LogsPage'
import { logout } from '../shared/adminApi'

export default function Layout() {
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarHidden, setSidebarHidden] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
      navigate('/login')
    }
  }

  const toggleSidebar = () => {
    if (sidebarHidden) {
      setSidebarHidden(false)
    } else if (sidebarCollapsed) {
      setSidebarCollapsed(false)
    } else {
      setSidebarCollapsed(true)
    }
  }

  const hideSidebar = () => {
    setSidebarHidden(true)
  }

  // Обработчик клика вне сайдбара
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) &&
        mainContentRef.current &&
        mainContentRef.current.contains(event.target as Node) &&
        !sidebarHidden
      ) {
        hideSidebar()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sidebarHidden])

  // Обработчик изменения размера окна
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 900) {
        setSidebarHidden(true)
      } else if (sidebarHidden) {
        setSidebarHidden(false)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Проверяем при загрузке

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [sidebarHidden])

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--background)'
    }}>
      {/* Sidebar */}
      <div ref={sidebarRef}>
        <Sidebar 
          isCollapsed={sidebarCollapsed}
          isHidden={sidebarHidden}
          onToggle={toggleSidebar}
        />
      </div>

      {/* Main Content */}
      <div 
        ref={mainContentRef}
        style={{
          flex: 1,
          marginLeft: sidebarHidden ? '0' : (sidebarCollapsed ? '60px' : '250px'),
          transition: 'margin-left 0.3s ease',
          background: 'var(--background)',
          minHeight: '100vh'
        }}
      >
        {/* Top Bar */}
        {sidebarHidden && (
          <div style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center'
          }}>
            <button
              onClick={() => setSidebarHidden(false)}
              className="btn-secondary"
              style={{ 
                padding: '8px 12px', 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
              Меню
            </button>
          </div>
        )}

        {/* Page Content */}
        <Routes>
          <Route path="/" element={<DocumentsPage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/logs" element={<LogsPage />} />
        </Routes>
      </div>
    </div>
  )
}
