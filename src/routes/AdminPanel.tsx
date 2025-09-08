import React, { useEffect, useState } from 'react'
import { listDocuments, listLogs, uploadDocument, logout, getDocumentTopics } from '../shared/adminApi'
import ChunkPreviewer from '../components/ChunkPreviewer'
import ChunksModal from '../components/ChunksModal'
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
  const [chunksModalOpen, setChunksModalOpen] = useState(false)
  const [selectedDocName, setSelectedDocName] = useState('')
  const [docChunks, setDocChunks] = useState<any[] | null>(null)
  const [chunksLoading, setChunksLoading] = useState(false)
  const [topicsModalOpen, setTopicsModalOpen] = useState(false)
  const [docTopics, setDocTopics] = useState<any[] | null>(null)
  const [topicsLoading, setTopicsLoading] = useState(false)
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

  const showChunks = async (docId: string, docName: string) => {
    setSelectedDocName(docName)
    setChunksModalOpen(true)
    setDocChunks(null)
    setChunksLoading(true)
    try {
      const r = await api.get(join(ADMIN_API_PREFIX, `documents/${docId}/chunks`))
      setDocChunks(r.data || [])
    } catch (err) {
      setStatus('Ошибка загрузки чанков')
    } finally {
      setChunksLoading(false)
    }
  }

  const showTopics = async (docId: string, docName: string) => {
    setSelectedDocName(docName)
    setTopicsModalOpen(true)
    setDocTopics(null)
    setTopicsLoading(true)
    try {
      const topics = await getDocumentTopics(docId)
      setDocTopics(topics || [])
    } catch (err) {
      setStatus('Ошибка загрузки топиков')
    } finally {
      setTopicsLoading(false)
    }
  }

  const deleteDocument = async (docId: string) => {
    if (!confirm('Удалить документ и связанные чанки?')) return
    setDeleting(true)
    try {
      await api.delete(join(ADMIN_API_PREFIX, `documents/${docId}`))
      await reloadDocs()
      setChunksModalOpen(false)
      setTopicsModalOpen(false)
      setDocChunks(null)
      setDocTopics(null)
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
                    <tr key={d.id}>
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
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button 
                            className="btn-secondary" 
                            onClick={() => showChunks(d.id, d.filename || d.title || 'Без названия')}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            Чанки
                          </button>
                          <button 
                            className="btn-secondary" 
                            onClick={() => showTopics(d.id, d.filename || d.title || 'Без названия')}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            Топики
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

      {/* Chunks Modal */}
      <ChunksModal
        isOpen={chunksModalOpen}
        onClose={() => setChunksModalOpen(false)}
        chunks={docChunks}
        documentName={selectedDocName}
        loading={chunksLoading}
      />

      {/* Topics Modal */}
      {topicsModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px' }}>Топики документа</h2>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {selectedDocName}
                </p>
              </div>
              <button
                onClick={() => setTopicsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px'
            }}>
              {topicsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Загрузка топиков...
                </div>
              ) : docTopics && docTopics.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Топики не найдены
                </div>
              ) : docTopics ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {docTopics.map((topic, i) => (
                    <div key={i} style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '16px',
                      background: 'var(--surface)'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                          Топик #{topic.topic_index}
                        </h3>
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          background: 'var(--surface-hover)',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          стр. {topic.start_page}–{topic.end_page}
                        </div>
                      </div>
                      <p style={{
                        margin: 0,
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>
                        {topic.title}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface-hover)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Всего топиков: {docTopics?.length || 0}
              </div>
              <button
                onClick={() => setTopicsModalOpen(false)}
                className="btn-secondary"
                style={{ fontSize: '14px', padding: '8px 16px' }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
