import React, { useEffect, useState } from 'react'
import { listDocuments, listLogs, uploadDocument, logout } from '../shared/adminApi'
import ChunkPreviewer from '../components/ChunkPreviewer'
import { useNavigate } from 'react-router-dom'
import { api, ADMIN_API_PREFIX, join } from '../shared/http'

type DocType = 'CC&R'|'Bylaws'|'Rules'|'Policy'|'Guidelines'

export default function AdminPanel(){
  const navigate = useNavigate()
  const [tab, setTab] = useState<'upload'|'docs'|'logs'>('upload')
  const [communityId, setCid] = useState(1)
  const [docs, setDocs] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [openDocId, setOpenDocId] = useState<string | null>(null)
  const [docChunks, setDocChunks] = useState<any[] | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  const validateFileSize = (file: File): boolean => {
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      setStatus('Ошибка: Файл слишком большой. Максимальный размер: 25MB')
      return false
    }
    return true
  }

  const onUpload = async (e: React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const file = fd.get('file') as File
    
    // Валидация размера файла
    if (!file || !validateFileSize(file)) {
      return
    }

    // Предупреждение для больших файлов
    if (file.size > 10 * 1024 * 1024) { // 10MB
      setStatus('⚠️ Большой файл выбран. Обработка может занять несколько минут...')
    }

    fd.set('community_id', String(communityId))
    setLoading(true)
    setStatus('Обработка документа... Это может занять несколько минут')
    
    try{
      const r = await uploadDocument(fd)
      setStatus(`✅ Документ успешно загружен! ID: ${r.document_id}, чанков: ${r.chunks_inserted}`)
      setTab('docs')
      reloadDocs()
    }catch(err:any){
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setStatus('❌ Загрузка отменена по таймауту. Попробуйте еще раз с файлом меньшего размера.')
      } else if (err.response?.status === 413) {
        setStatus('❌ Файл слишком большой. Максимальный размер: 25MB')
      } else {
        setStatus(`❌ Ошибка загрузки: ${err.message || 'Неизвестная ошибка'}`)
      }
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

  const showChunks = async (docId: string) => {
    setOpenDocId(docId)
    setDocChunks(null)
    try {
      const r = await api.get(join(ADMIN_API_PREFIX, `documents/${docId}/chunks`))
      setDocChunks(r.data || [])
    } catch (err) {
      setStatus('Ошибка загрузки чанков')
    }
  }

  const deleteDocument = async (docId: string) => {
    if (!confirm('Удалить документ и связанные чанки?')) return
    setDeleting(true)
    try {
      await api.delete(join(ADMIN_API_PREFIX, `documents/${docId}`))
      await reloadDocs()
      if (openDocId === docId) {
        setOpenDocId(null)
        setDocChunks(null)
      }
      setStatus('Документ успешно удален')
    } catch (err) {
      setStatus('Ошибка удаления документа')
    } finally {
      setDeleting(false)
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
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  setSelectedFile(file)
                  if (file) {
                    if (file.size > 25 * 1024 * 1024) {
                      setStatus('❌ Файл слишком большой. Максимальный размер: 25MB')
                    } else if (file.size > 10 * 1024 * 1024) {
                      setStatus('⚠️ Большой файл выбран. Обработка может занять несколько минут...')
                    } else {
                      setStatus('')
                    }
                  }
                }}
              />
              <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                Поддерживаемые форматы: PDF, TXT (максимум 25MB)
              </p>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
              style={{ alignSelf: 'flex-start', marginTop: '8px' }}
            >
              {loading ? '⏳ Обрабатываю документ...' : '📤 Загрузить документ'}
            </button>
          </form>
          
          {/* Chunk Previewer */}
          <ChunkPreviewer file={selectedFile} />
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
                    <th>Страниц</th>
                    <th>Размер</th>
                    <th>Дата создания</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map(d=>(
                    <React.Fragment key={d.id}>
                      <tr>
                        <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>#{d.id}</td>
                        <td style={{ fontWeight: '500' }}>{d.filename || d.title || 'Без названия'}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                          {d.pages || '—'}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                          {d.size_bytes ? `${(d.size_bytes/1024/1024).toFixed(2)} MB` : '—'}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                          {new Date(d.created_at).toLocaleString('ru-RU')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn-secondary" 
                              onClick={() => showChunks(d.id)}
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              Чанки
                            </button>
                            {d.rel_path && (
                              <a 
                                className="btn-secondary" 
                                href={`/static/${d.rel_path}`} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{ fontSize: '12px', padding: '4px 8px', textDecoration: 'none' }}
                              >
                                PDF
                              </a>
                            )}
                            <button 
                              className="btn-danger" 
                              onClick={() => deleteDocument(d.id)}
                              disabled={deleting}
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                      {openDocId === d.id && (
                        <tr>
                          <td colSpan={6} style={{ background: 'var(--surface-hover)', padding: '0' }}>
                            <div style={{ padding: '16px', maxHeight: '300px', overflow: 'auto' }}>
                              {docChunks ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {docChunks.map((chunk, i) => (
                                    <div key={i} style={{ 
                                      border: '1px solid var(--border)', 
                                      borderRadius: '4px', 
                                      padding: '8px',
                                      background: 'var(--surface)'
                                    }}>
                                      <div style={{ 
                                        fontSize: '12px', 
                                        color: 'var(--text-muted)',
                                        marginBottom: '4px'
                                      }}>
                                        #{chunk.id} · {chunk.page ? `стр. ${chunk.page}` : 'стр. —'} · {chunk.start ?? '?'}-{chunk.end ?? '?'}
                                      </div>
                                      <div style={{ 
                                        whiteSpace: 'pre-wrap', 
                                        fontSize: '13px',
                                        lineHeight: '1.4'
                                      }}>
                                        {chunk.preview}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                  Загрузка чанков...
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
