import React, { useEffect, useState } from 'react'
import { listDocuments, listLogs, uploadDocument, logout } from '../lib/api'

type DocType = 'CC&R'|'Bylaws'|'Rules'|'Policy'|'Guidelines'

export default function AdminPanel(){
  const [tab, setTab] = useState<'upload'|'docs'|'logs'>('upload')
  const [communityId, setCid] = useState(1)
  const [docs, setDocs] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [status, setStatus] = useState('')

  const reloadDocs = async ()=> setDocs(await listDocuments(communityId))
  const reloadLogs = async ()=> setLogs(await listLogs(100))

  useEffect(()=>{ if(tab==='docs') reloadDocs(); if(tab==='logs') reloadLogs(); },[tab,communityId])

  const onUpload = async (e: React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('community_id', String(communityId))
    setStatus('Загружаю…')
    try{
      const r = await uploadDocument(fd)
      setStatus(`OK: документ #${r.document_id}, чанков: ${r.chunks_inserted}`)
      setTab('docs'); reloadDocs()
    }catch(err:any){
      setStatus('Ошибка загрузки')
    }
  }

  return (
    <div className="wrap">
      <div className="card">
        <h1>Админка HOA</h1>
        <div className="row" style={{marginBottom:8,alignItems:'center'}}>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setTab('upload')}>Загрузка</button>
            <button onClick={()=>setTab('docs')}>Документы</button>
            <button onClick={()=>setTab('logs')}>Логи</button>
          </div>
          <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
            <span className="muted">Community</span>
            <input type="number" value={communityId} min={1} onChange={e=>setCid(Number(e.target.value))}/>
            <button onClick={async()=>{ await logout(); location.href='/login' }}>Выйти</button>
          </div>
        </div>
        {status && <p className="muted">{status}</p>}
        {tab==='upload' && (
          <form onSubmit={onUpload} style={{display:'grid',gap:10}}>
            <input name="title" placeholder="Название документа" required />
            <select name="doc_type" required>
              <option value="">Тип документа…</option>
              <option>CC&R</option><option>Bylaws</option><option>Rules</option><option>Policy</option><option>Guidelines</option>
            </select>
            <select name="visibility" defaultValue="resident">
              <option value="resident">resident (Жители)</option>
              <option value="board">board (Правление)</option>
              <option value="staff">staff (Офис)</option>
            </select>
            <input type="file" name="file" accept=".pdf,.txt" required />
            <button type="submit">Загрузить</button>
          </form>
        )}
        {tab==='docs' && (
          <table className="table">
            <thead><tr><th>ID</th><th>Название</th><th>Тип</th><th>Создан</th><th>Чанков</th></tr></thead>
            <tbody>
              {docs.map(d=>(
                <tr key={d.id}><td>{d.id}</td><td>{d.title}</td><td>{d.doc_type}</td><td>{new Date(d.created_at).toLocaleString()}</td><td>{d.chunks}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        {tab==='logs' && (
          <table className="table">
            <thead><tr><th>Дата</th><th>Роль</th><th>Вопрос</th><th>Conf.</th></tr></thead>
            <tbody>
              {logs.map((l,i)=>(
                <tr key={i}><td>{new Date(l.created_at).toLocaleString()}</td><td>{l.user_role}</td><td>{l.question}</td><td>{Number(l.confidence).toFixed(3)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
