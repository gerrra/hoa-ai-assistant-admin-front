import React, { useEffect, useState } from 'react'
import { listDocuments, getDocumentTopics, listCommunities } from '../shared/adminApi'
import ChunksModal from '../components/ChunksModal'
import TopicsModal from '../components/TopicsModal'
import UploadModal from '../components/UploadModal'
import { useToast } from '../components/Toast'
import { api, ADMIN_API_PREFIX, join } from '../shared/http'

export default function DocumentsPage() {
  const { addToast, ToastContainer } = useToast()
  const [communities, setCommunities] = useState<any[]>([])
  const [filters, setFilters] = useState({
    communityId: '',
    search: '',
    docType: '',
    visibility: '',
    sortBy: 'created_at' as 'created_at' | 'title' | 'pages'
  })
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

  const loadCommunities = async () => {
    try {
      const data = await listCommunities()
      setCommunities(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка загрузки сообществ'
      addToast(String(errorMessage), 'error')
    }
  }

  const reloadDocs = async () => {
    setLoading(true)
    try {
      const communityId = filters.communityId ? Number(filters.communityId) : undefined
      const allDocs = await listDocuments(communityId)
      
      // Применяем фильтры на фронтенде
      let filteredDocs = (allDocs || []).filter(doc => {
        const matchesSearch = !filters.search || 
          (doc.title || '').toLowerCase().includes(filters.search.toLowerCase()) ||
          (doc.filename || '').toLowerCase().includes(filters.search.toLowerCase())
        
        const matchesDocType = !filters.docType || doc.doc_type === filters.docType
        const matchesVisibility = !filters.visibility || doc.visibility === filters.visibility
        
        return matchesSearch && matchesDocType && matchesVisibility
      })

      // Сортировка
      filteredDocs.sort((a, b) => {
        switch (filters.sortBy) {
          case 'title':
            return (a.title || a.filename || '').localeCompare(b.title || b.filename || '')
          case 'pages':
            return (b.pages || 0) - (a.pages || 0)
          case 'created_at':
          default:
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        }
      })

      setDocs(filteredDocs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCommunities()
  }, [])

  useEffect(() => {
    reloadDocs()
  }, [filters])

  const handleUploadSuccess = (result: any) => {
    const topicsText = result.topics_inserted > 0 ? `, топиков: ${result.topics_inserted}` : ''
    addToast(`Документ успешно загружен! ID: ${result.document_id}, чанков: ${result.chunks_inserted}${topicsText}`, 'success')
    reloadDocs()
  }

  const showChunks = async (docId: string, docName: string) => {
    setSelectedDocName(docName)
    setChunksModalOpen(true)
    setDocChunks(null)
    setChunksLoading(true)
    try {
      const r = await api.get(join(ADMIN_API_PREFIX, `documents/${docId}/chunks`))
      setDocChunks(r.data || [])
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка загрузки чанков'
      addToast(String(errorMessage), 'error')
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
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка загрузки топиков'
      addToast(String(errorMessage), 'error')
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
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка удаления документа'
      addToast(String(errorMessage), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      communityId: '',
      search: '',
      docType: '',
      visibility: '',
      sortBy: 'created_at'
    })
  }

  const getCommunityName = (communityId: number | undefined) => {
    if (!communityId) return '—'
    const community = communities.find(c => c.id === communityId)
    return community?.name || `ID: ${communityId}`
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
          Документы
        </h1>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Добавить документ
        </button>
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'flex-end'
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-secondary)'
            }}>
              Сообщество
            </label>
            <select
              value={filters.communityId}
              onChange={(e) => setFilters(prev => ({ ...prev, communityId: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '14px'
              }}
            >
              <option value="">Все сообщества</option>
              {communities.map(community => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-secondary)'
            }}>
              Поиск
            </label>
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-secondary)'
            }}>
              Тип документа
            </label>
            <select
              value={filters.docType}
              onChange={(e) => setFilters(prev => ({ ...prev, docType: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '14px'
              }}
            >
              <option value="">Все типы</option>
              <option value="CC&R">CC&R</option>
              <option value="Bylaws">Bylaws</option>
              <option value="Rules">Rules</option>
              <option value="Policy">Policy</option>
              <option value="Guidelines">Guidelines</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-secondary)'
            }}>
              Видимость
            </label>
            <select
              value={filters.visibility}
              onChange={(e) => setFilters(prev => ({ ...prev, visibility: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '14px'
              }}
            >
              <option value="">Все уровни</option>
              <option value="resident">Жители</option>
              <option value="board">Правление</option>
              <option value="staff">Офис</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-secondary)'
            }}>
              Сортировка
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '14px'
              }}
            >
              <option value="created_at">По дате создания</option>
              <option value="title">По названию</option>
              <option value="pages">По количеству страниц</option>
            </select>
          </div>

          <div>
            <button
              onClick={clearFilters}
              className="btn-secondary"
              style={{ 
                padding: '8px 16px', 
                fontSize: '14px'
              }}
            >
              Очистить фильтры
            </button>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden'
      }}>
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
                  <th>Название</th>
                  <th>Тип</th>
                  <th>Страниц</th>
                  <th>Размер</th>
                  <th>Чанки</th>
                  <th>Топики</th>
                  <th>Community</th>
                  <th>Дата создания</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(d=>(
                  <tr key={d.id}>
                    <td style={{ fontWeight: '500' }}>{d.title || d.filename || 'Без названия'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {d.doc_type ? (
                        <span style={{
                          background: 'var(--primary-light)',
                          color: 'var(--primary)',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {d.doc_type}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                      {d.pages || '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {d.size_bytes ? `${(d.size_bytes/1024/1024).toFixed(2)} MB` : '—'}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                      {d.chunks ? (
                        <button
                          onClick={() => showChunks(d.id, d.title || d.filename || 'Без названия')}
                          style={{
                            background: 'var(--success)',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#059669'
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'var(--success)'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          {d.chunks}
                        </button>
                      ) : '—'}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                      {d.topics ? (
                        <button
                          onClick={() => showTopics(d.id, d.title || d.filename || 'Без названия')}
                          style={{
                            background: 'var(--warning)',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#d97706'
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'var(--warning)'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          {d.topics}
                        </button>
                      ) : '—'}
                    </td>
                    <td style={{ textAlign: 'left' }}>
                      {getCommunityName(d.community_id)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {new Date(d.created_at).toLocaleString('ru-RU')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-start' }}>
                        {d.rel_path && (
                          <a 
                            href={`http://localhost:8000/${d.rel_path}`} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              background: 'none',
                              color: 'var(--text-muted)',
                              border: 'none',
                              borderRadius: 'var(--radius)',
                              cursor: 'pointer',
                              textDecoration: 'none',
                              fontSize: '16px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.color = 'var(--primary)'
                              e.currentTarget.style.transform = 'scale(1.1)'
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.color = 'var(--text-muted)'
                              e.currentTarget.style.transform = 'scale(1)'
                            }}
                            title="Просмотреть документ"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </a>
                        )}
                        <button 
                          onClick={() => deleteDocument(d.id)}
                          disabled={deleting}
                          style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            minWidth: '32px',
                            background: 'none',
                            color: deleting ? 'var(--text-muted)' : '#ef4444',
                            border: 'none',
                            borderRadius: 'var(--radius)',
                            cursor: deleting ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            transition: 'all 0.2s ease',
                            opacity: deleting ? 0.6 : 1,
                            flexShrink: 0,
                            padding: '0',
                            margin: '0'
                          }}
                          onMouseOver={(e) => {
                            if (!deleting) {
                              e.currentTarget.style.color = '#dc2626'
                              e.currentTarget.style.transform = 'scale(1.1)'
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!deleting) {
                              e.currentTarget.style.color = '#ef4444'
                              e.currentTarget.style.transform = 'scale(1)'
                            }
                          }}
                          title="Удалить документ"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
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
        communityId={0}
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
      <TopicsModal
        isOpen={topicsModalOpen}
        onClose={() => setTopicsModalOpen(false)}
        topics={docTopics}
        documentName={selectedDocName}
        loading={topicsLoading}
      />

      <ToastContainer />
    </div>
  )
}
