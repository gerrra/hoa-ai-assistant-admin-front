import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminPanel from './routes/AdminPanel'
import AdminLogin from './routes/AdminLogin'
import AdminGuard from './routes/AdminGuard'
import LogsPage from './pages/LogsPage'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/" element={<AdminGuard><AdminPanel /></AdminGuard>} />
        <Route path="/logs" element={<AdminGuard><LogsPage /></AdminGuard>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
