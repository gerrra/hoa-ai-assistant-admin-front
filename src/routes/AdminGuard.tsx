import React, { useEffect, useState } from 'react'
import { me } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function AdminGuard({children}:{children:React.ReactNode}){
  const nav = useNavigate()
  const [ready, setReady] = useState(false)
  
  useEffect(()=>{ 
    (async()=>{
      try {
        const r = await me()
        if(!r.authenticated) nav('/login')
        else setReady(true)
      } catch {
        nav('/login')
      }
    })() 
  },[])
  
  if(!ready) return null
  return <>{children}</>
}
