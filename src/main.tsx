import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLogin from './routes/AdminLogin'
import AdminGuard from './routes/AdminGuard'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/*" element={<AdminGuard><Layout /></AdminGuard>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
