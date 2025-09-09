import React, { useEffect, useState } from 'react'
import { listCommunities, createCommunity, updateCommunity, deleteCommunity } from '../shared/adminApi'
import { useToast } from '../components/Toast'

type Community = {
  id: number
  name: string
  description: string
  created_at: string
}

export default function CommunitiesPage() {
  const { addToast, ToastContainer } = useToast()
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'name' as 'name' | 'created_at'
  })

  const loadCommunities = async () => {
    setLoading(true)
    try {
      const data = await listCommunities()
      setCommunities(data)
    } catch (err) {
      addToast('Ошибка загрузки сообществ', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCommunities()
  }, [])

  const handleCreate = async (data: { name: string; description?: string }) => {
    try {
      await createCommunity(data)
      addToast('Сообщество успешно создано', 'success')
      setShowCreateModal(false)
      loadCommunities()
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка создания сообщества'
      addToast(String(errorMessage), 'error')
    }
  }

  const handleUpdate = async (id: number, data: { name: string; description?: string }) => {
    try {
      await updateCommunity(id, data)
      addToast('Сообщество успешно обновлено', 'success')
      setEditingCommunity(null)
      loadCommunities()
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка обновления сообщества'
      addToast(String(errorMessage), 'error')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить сообщество? Это действие нельзя отменить.')) return
    
    try {
      await deleteCommunity(id)
      addToast('Сообщество успешно удалено', 'success')
      loadCommunities()
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка удаления сообщества'
      addToast(String(errorMessage), 'error')
    }
  }

  const clearFilters = () => {
    setFilters({ search: '', sortBy: 'name' })
  }

  const filteredCommunities = (communities || [])
    .filter(community => 
      (community.name || '').toLowerCase().includes(filters.search.toLowerCase()) ||
      (community.description || '').toLowerCase().includes(filters.search.toLowerCase())
    )
    .sort((a, b) => {
      if (filters.sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '')
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

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
          Сообщества
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
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
          Добавить сообщество
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
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-end',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
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
              placeholder="Поиск по названию или описанию..."
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
          
          <div style={{ minWidth: '150px' }}>
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
              <option value="name">По названию</option>
              <option value="created_at">По дате создания</option>
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

      {/* Communities List */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Загружаю сообщества...
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <p>Сообщества не найдены</p>
            <p className="muted">Нажмите "Добавить сообщество" для создания первого</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Описание</th>
                  <th>Дата создания</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommunities.map(community => (
                  <tr key={community.id}>
                    <td style={{ fontWeight: '600' }}>
                      {community.name}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {community.description || '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {new Date(community.created_at).toLocaleString('ru-RU')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-start' }}>
                        <button
                          onClick={() => setEditingCommunity(community)}
                          style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            minWidth: '32px',
                            background: 'none',
                            color: 'var(--text-muted)',
                            border: 'none',
                            borderRadius: 'var(--radius)',
                            cursor: 'pointer',
                            fontSize: '16px',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                            padding: '0',
                            margin: '0'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.color = 'var(--primary)'
                            e.currentTarget.style.transform = 'scale(1.1)'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.color = 'var(--text-muted)'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                          title="Редактировать сообщество"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(community.id)}
                          style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            minWidth: '32px',
                            background: 'none',
                            color: '#ef4444',
                            border: 'none',
                            borderRadius: 'var(--radius)',
                            cursor: 'pointer',
                            fontSize: '16px',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                            padding: '0',
                            margin: '0'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.color = '#dc2626'
                            e.currentTarget.style.transform = 'scale(1.1)'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.color = '#ef4444'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                          title="Удалить сообщество"
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

      {/* Create/Edit Modal */}
      {(showCreateModal || editingCommunity) && (
        <CommunityModal
          isOpen={true}
          onClose={() => {
            setShowCreateModal(false)
            setEditingCommunity(null)
          }}
          onSubmit={editingCommunity ? 
            (data) => handleUpdate(editingCommunity.id, data) : 
            handleCreate
          }
          initialData={editingCommunity ? {
            name: editingCommunity.name,
            description: editingCommunity.description
          } : undefined}
          title={editingCommunity ? 'Редактировать сообщество' : 'Создать сообщество'}
        />
      )}

      <ToastContainer />
    </div>
  )
}

// Community Modal Component
type CommunityModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description?: string }) => void
  initialData?: { name: string; description: string }
  title: string
}

function CommunityModal({ isOpen, onClose, onSubmit, initialData, title }: CommunityModalProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setLoading(true)
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
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
        maxWidth: '500px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>{title}</h2>
          <button
            onClick={onClose}
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

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              Название сообщества *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Введите название сообщества"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Введите описание сообщества (необязательно)"
              disabled={loading}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Сохранение...' : (initialData ? 'Сохранить' : 'Создать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
