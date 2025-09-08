import { useEffect, useState } from 'react'
import { listDocuments, logout, getDocumentTopics } from '../shared/adminApi'
import ChunksModal from '../components/ChunksModal'
import UploadModal from '../components/UploadModal'
import { useToast } from '../components/Toast'
import { useNavigate } from 'react-router-dom'
import { api, ADMIN_API_PREFIX, join } from '../shared/http'


export default function AdminPanel(){
  const navigate = useNavigate()
  const { addToast, ToastContainer } = useToast()
  const [communityId, setCid] = useState(1)
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [chunksModalOpen, setChunksModalOpen] = useState(false)
  const [selectedDocName, setSelectedDocName] = useState('')
  const [docChunks, setDocChunks] = useState<any[] | null>(null)
  const [chunksLoading, setChunksLoading] = useState(false)
  const [topicsModalOpen, setTopicsModalOpen] = useState(false)
  const [docTopics, setDocTopics] = useState<any[] | null>(null)
  const [topicsLoading, setTopicsLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  const reloadDocs = async ()=> {
    setLoading(true)
    try {
      setDocs(await listDocuments(communityId))
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ 
    reloadDocs()
  },[communityId])

  const handleUploadSuccess = (result: any) => {
    addToast(`Документ успешно загружен! ID: ${result.document_id}, чанков: ${result.chunks_inserted}`, 'success')
    reloadDocs()
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
      addToast('Ошибка загрузки чанков', 'error')
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
      addToast('Ошибка загрузки топиков', 'error')
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
      addToast('Документ успешно удален', 'success')
    } catch (err) {
      addToast('Ошибка удаления документа', 'error')
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
            <button onClick={() => navigate('/logs')} className="btn-secondary">
              📊 Логи запросов
            </button>
            <button onClick={handleLogout} className="btn-secondary">
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2>Документы сообщества #{communityId}</h2>
          <div className="row" style={{ gap: '12px' }}>
            <button onClick={() => setUploadModalOpen(true)} className="btn-primary">
              📤 Добавить документ
            </button>
            <button onClick={reloadDocs} className="btn-secondary" disabled={loading}>
              {loading ? 'Обновляю...' : '🔄 Обновить'}
            </button>
          </div>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Загружаю документы...
          </div>
        ) : docs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <p>Документы не найдены</p>
            <p className="muted">Нажмите "Добавить документ" для загрузки первого документа</p>
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

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
        communityId={communityId}
      />

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

      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
}
