import React, { useState, useEffect } from 'react'
import { login, me } from '../shared/adminApi'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin(){
  const nav = useNavigate()
  const [password, setPwd] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  
  useEffect(()=>{ 
    me().then(r=>{ 
      if(r.authenticated) nav('/') 
    }).catch(() => {
      // Ignore errors, user is not authenticated
    })
  },[])
  
  const onSubmit = async (e:React.FormEvent)=>{
    e.preventDefault()
    setLoading(true)
    setStatus('')
    try{ 
      await login(password)
      nav('/') 
    }
    catch{ 
      setStatus('Неверный пароль') 
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'white',
      padding: '20px'
    }}>
      <div className="card" style={{
        maxWidth: 400,
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'var(--primary)',
            borderRadius: '50%',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: 'white',
            fontWeight: 'bold'
          }}>
            A
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>HOA Admin Panel</h1>
          <p className="muted" style={{ margin: 0 }}>Войдите в систему управления</p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="col">
          <div style={{ textAlign: 'left', marginBottom: '8px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              Пароль администратора
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={e=>setPwd(e.target.value)} 
              placeholder="Введите пароль" 
              required 
              disabled={loading}
              style={{ marginBottom: '0' }}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading || !password.trim()}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? 'Входим...' : 'Войти в систему'}
          </button>
          
          {status && (
            <div className={`status ${status.includes('Неверный') ? 'error' : 'info'}`}>
              {status}
            </div>
          )}
        </form>

        {/* Footer */}
        <div style={{ 
          marginTop: '32px', 
          paddingTop: '20px', 
          borderTop: '1px solid var(--border)',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          HOA AI Assistant v1.0
        </div>
      </div>
    </div>
  )
}
