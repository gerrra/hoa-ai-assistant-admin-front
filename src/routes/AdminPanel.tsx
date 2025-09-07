import React, { useEffect, useState } from 'react'
import { listDocuments, listLogs, uploadDocument, logout } from '../shared/adminApi'

type DocType = 'CC&R'|'Bylaws'|'Rules'|'Policy'|'Guidelines'

export default function AdminPanel(){
  const [tab, setTab] = useState<'upload'|'docs'|'logs'>('upload')
  const [communityId, setCid] = useState(1)
  const [docs, setDocs] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const reloadDocs = async ()=> {
    setLoading(true)
    try {
      setDocs(await listDocuments(communityId))
    } finally {
      setLoading(false)
    }
  }
  const reloadLogs = async ()=> {
    setLoading(true)
    try {
      setLogs(await listLogs(100))
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ 
    if(tab==='docs') reloadDocs()
    if(tab==='logs') reloadLogs() 
  },[tab,communityId])

  const onUpload = async (e: React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('community_id', String(communityId))
    setLoading(true)
    setStatus('')
    try{
      const r = await uploadDocument(fd)
      setStatus(`Документ успешно загружен! ID: ${r.document_id}, чанков: ${r.chunks_inserted}`)
      setTab('docs')
      reloadDocs()
    }catch(err:any){
      setStatus('Ошибка загрузки документа')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      location.href = '/login'
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <div className="wrap">
      {/* Header */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>HOA Admin Panel</h1>
            <p className="muted" style={{ margin: '4px 0 0 0' }}>Управление документами и аналитика</p>
          </div>
          <div className="row" style={{ alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Community ID:
              </label>
              <input 
                type="number" 
                value={communityId} 
                min={1} 
                onChange={e=>setCid(Number(e.target.value))}
                style={{ width: '80px' }}
              />
            </div>
            <button onClick={handleLogout} className="btn-secondary">
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card" style={{ padding: '0', marginBottom: '24px' }}>
        <div className="tabs">
          <button 
            className={`tab ${tab === 'upload' ? 'active' : ''}`}
            onClick={()=>setTab('upload')}
          >
            📤 Загрузка документов
          </button>
          <button 
            className={`tab ${tab === 'docs' ? 'active' : ''}`}
            onClick={()=>setTab('docs')}
          >
            📄 Документы ({docs.length})
          </button>
          <button 
            className={`tab ${tab === 'logs' ? 'active' : ''}`}
            onClick={()=>setTab('logs')}
          >
            📊 Логи запросов ({logs.length})
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {status && (
        <div className={`status ${status.includes('успешно') ? 'success' : status.includes('Ошибка') ? 'error' : 'info'}`}>
          {status}
        </div>
      )}

      {/* Upload Tab */}
      {tab === 'upload' && (
        <div className="card">
          <h2>Загрузка нового документа</h2>
          <form onSubmit={onUpload} className="col" style={{ maxWidth: '600px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: 'var(--text-primary)'
              }}>
                Название документа *
              </label>
              <input 
                name="title" 
                placeholder="Введите название документа" 
                required 
                disabled={loading}
              />
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: 'var(--text-primary)'
              }}>
                Тип документа *
              </label>
              <select name="doc_type" required disabled={loading}>
                <option value="">Выберите тип документа</option>
                <option value="CC&R">CC&R (Условия, ограничения и правила)</option>
                <option value="Bylaws">Bylaws (Устав)</option>
                <option value="Rules">Rules (Правила)</option>
                <option value="Policy">Policy (Политика)</option>
                <option value="Guidelines">Guidelines (Руководящие принципы)</option>
              </select>
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: 'var(--text-primary)'
              }}>
                Видимость документа
              </label>
              <select name="visibility" defaultValue="resident" disabled={loading}>
                <option value="resident">👥 Жители (Resident)</option>
                <option value="board">👔 Правление (Board)</option>
                <option value="staff">🏢 Офис (Staff)</option>
              </select>
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: 'var(--text-primary)'
              }}>
                Файл документа *
              </label>
              <input 
                type="file" 
                name="file" 
                accept=".pdf,.txt" 
                required 
                disabled={loading}
                style={{ padding: '8px' }}
              />
              <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                Поддерживаемые форматы: PDF, TXT
              </p>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
              style={{ alignSelf: 'flex-start', marginTop: '8px' }}
            >
              {loading ? 'Загружаю...' : '📤 Загрузить документ'}
            </button>
          </form>
        </div>
      )}

      {/* Documents Tab */}
      {tab === 'docs' && (
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>Документы сообщества #{communityId}</h2>
            <button onClick={reloadDocs} className="btn-secondary" disabled={loading}>
              {loading ? 'Обновляю...' : '🔄 Обновить'}
            </button>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Загружаю документы...
            </div>
          ) : docs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <p>Документы не найдены</p>
              <p className="muted">Загрузите первый документ на вкладке "Загрузка документов"</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Тип</th>
                    <th>Дата создания</th>
                    <th>Чанков</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map(d=>(
                    <tr key={d.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>#{d.id}</td>
                      <td style={{ fontWeight: '500' }}>{d.title}</td>
                      <td>
                        <span style={{
                          background: 'var(--primary-light)',
                          color: 'var(--primary)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {d.doc_type}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {new Date(d.created_at).toLocaleString('ru-RU')}
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{d.chunks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {tab === 'logs' && (
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>Логи запросов</h2>
            <button onClick={reloadLogs} className="btn-secondary" disabled={loading}>
              {loading ? 'Обновляю...' : '🔄 Обновить'}
            </button>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Загружаю логи...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <p>Логи не найдены</p>
              <p className="muted">Запросы появятся здесь после использования системы</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Дата и время</th>
                    <th>Роль пользователя</th>
                    <th>Вопрос</th>
                    <th>Уверенность</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l,i)=>(
                    <tr key={i}>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {new Date(l.created_at).toLocaleString('ru-RU')}
                      </td>
                      <td>
                        <span style={{
                          background: l.user_role === 'resident' ? '#d1fae5' : 
                                     l.user_role === 'board' ? '#dbeafe' : '#fef3c7',
                          color: l.user_role === 'resident' ? '#065f46' : 
                                 l.user_role === 'board' ? '#1e40af' : '#92400e',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {l.user_role === 'resident' ? '👥 Житель' : 
                           l.user_role === 'board' ? '👔 Правление' : '🏢 Офис'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '300px', wordBreak: 'break-word' }}>{l.question}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                        <span style={{
                          color: Number(l.confidence) > 0.8 ? 'var(--success)' : 
                                 Number(l.confidence) > 0.6 ? 'var(--warning)' : 'var(--danger)',
                          fontWeight: '600'
                        }}>
                          {(Number(l.confidence) * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
