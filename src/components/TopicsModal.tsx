import React, { useState, useEffect } from 'react'

type Topic = {
  id: number
  topic_index: number
  title: string
  description?: string
  start_page: number
  end_page: number
  page_numbers: number[]
  created_at: string
  document_title?: string
}

type TopicsModalProps = {
  isOpen: boolean
  onClose: () => void
  topics: Topic[] | null
  documentName: string
  loading: boolean
}

export default function TopicsModal({ isOpen, onClose, topics, documentName, loading }: TopicsModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'index' | 'title' | 'pages'>('index')
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set())

  const toggleTopic = (topicId: number) => {
    const newExpanded = new Set(expandedTopics)
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId)
    } else {
      newExpanded.add(topicId)
    }
    setExpandedTopics(newExpanded)
  }

  const filteredAndSortedTopics = React.useMemo(() => {
    if (!topics) return []
    
    let filtered = topics.filter(topic =>
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (topic.description && topic.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'index':
          return a.topic_index - b.topic_index
        case 'title':
          return a.title.localeCompare(b.title)
        case 'pages':
          return a.start_page - b.start_page
        default:
          return 0
      }
    })

    return filtered
  }, [topics, searchTerm, sortBy])

  const formatPageNumbers = (pageNumbers: number[]) => {
    if (pageNumbers.length === 0) return '—'
    if (pageNumbers.length <= 3) return pageNumbers.join(', ')
    
    const sorted = [...pageNumbers].sort((a, b) => a - b)
    const ranges = []
    let start = sorted[0]
    let end = sorted[0]
    
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i]
      } else {
        ranges.push(start === end ? start.toString() : `${start}-${end}`)
        start = end = sorted[i]
      }
    }
    ranges.push(start === end ? start.toString() : `${start}-${end}`)
    
    return ranges.join(', ')
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
        maxWidth: '1000px',
        maxHeight: '90vh',
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
              {documentName}
            </p>
          </div>
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

        {/* Controls */}
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Поиск по названию или описанию топика..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Сортировка:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '14px'
              }}
            >
              <option value="index">По номеру</option>
              <option value="title">По названию</option>
              <option value="pages">По страницам</option>
            </select>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Найдено: {filteredAndSortedTopics.length} из {topics?.length || 0}
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Загрузка топиков...
            </div>
          ) : filteredAndSortedTopics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              {searchTerm ? 'Топики не найдены' : 'Топики не найдены'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredAndSortedTopics.map((topic) => (
                <div key={topic.id} style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  background: 'var(--surface)'
                }}>
                  {/* Topic Header */}
                  <div
                    onClick={() => toggleTopic(topic.id)}
                    style={{
                      background: 'var(--surface-hover)',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: expandedTopics.has(topic.id) ? '1px solid var(--border)' : 'none'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '4px'
                      }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                          Топик #{topic.topic_index}
                        </h3>
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          background: 'var(--primary-light)',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          стр. {topic.start_page}–{topic.end_page}
                        </div>
                      </div>
                      <h4 style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        lineHeight: '1.4'
                      }}>
                        {topic.title}
                      </h4>
                    </div>
                    <div style={{
                      fontSize: '18px',
                      color: 'var(--text-muted)',
                      transform: expandedTopics.has(topic.id) ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      marginLeft: '16px'
                    }}>
                      ▶
                    </div>
                  </div>

                  {/* Topic Details */}
                  {expandedTopics.has(topic.id) && (
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Description */}
                        {topic.description && (
                          <div>
                            <h5 style={{ 
                              margin: '0 0 8px 0', 
                              fontSize: '13px', 
                              fontWeight: '600',
                              color: 'var(--text-secondary)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              Описание
                            </h5>
                            <p style={{
                              margin: 0,
                              color: 'var(--text-primary)',
                              fontSize: '14px',
                              lineHeight: '1.5',
                              background: 'var(--surface-hover)',
                              padding: '12px',
                              borderRadius: 'var(--radius)'
                            }}>
                              {topic.description}
                            </p>
                          </div>
                        )}

                        {/* Page Numbers */}
                        <div>
                          <h5 style={{ 
                            margin: '0 0 8px 0', 
                            fontSize: '13px', 
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Страницы
                          </h5>
                          <div style={{
                            background: 'var(--surface-hover)',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius)',
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            color: 'var(--text-primary)'
                          }}>
                            {formatPageNumbers(topic.page_numbers)}
                          </div>
                        </div>

                        {/* Metadata */}
                        <div style={{
                          display: 'flex',
                          gap: '16px',
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          paddingTop: '8px',
                          borderTop: '1px solid var(--border-light)'
                        }}>
                          <span>ID: {topic.id}</span>
                          <span>Создан: {new Date(topic.created_at).toLocaleString('ru-RU')}</span>
                          <span>Страниц: {topic.end_page - topic.start_page + 1}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
            Всего топиков: {topics?.length || 0} | 
            Показано: {filteredAndSortedTopics.length} | 
            Развернуто: {expandedTopics.size}
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
