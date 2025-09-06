import React, { useState, useEffect } from 'react'
import { login, me } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin(){
  const nav = useNavigate()
  const [password, setPwd] = useState('')
  const [status, setStatus] = useState('')
  
  useEffect(()=>{ 
    me().then(r=>{ 
      if(r.authenticated) nav('/admin') 
    }).catch(() => {
      // Ignore errors, user is not authenticated
    })
  },[])
  
  const onSubmit = async (e:React.FormEvent)=>{
    e.preventDefault()
    setStatus('Входим…')
    try{ 
      await login(password)
      nav('/admin') 
    }
    catch{ 
      setStatus('Неверный пароль') 
    }
  }
  
  return (
    <div className="wrap">
      <div className="card" style={{maxWidth:420,margin:'40px auto'}}>
        <h1>Вход в админку</h1>
        <form onSubmit={onSubmit} style={{display:'grid',gap:10}}>
          <input 
            type="password" 
            value={password} 
            onChange={e=>setPwd(e.target.value)} 
            placeholder="Пароль" 
            required 
          />
          <button type="submit">Войти</button>
          {status && <p className="muted">{status}</p>}
        </form>
      </div>
    </div>
  )
}
