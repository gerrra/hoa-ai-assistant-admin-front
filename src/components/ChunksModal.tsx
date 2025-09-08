import React, { useState, useEffect } from 'react'

type Chunk = {
  id: number
  page: number | null
  start: number | null
  end: number | null
  preview: string
  topic?: string
}

type ChunksModalProps = {
  isOpen: boolean
  onClose: () => void
  chunks: Chunk[] | null
  documentName: string
  loading: boolean
}

export default function ChunksModal({ isOpen, onClose, chunks, documentName, loading }: ChunksModalProps) {
  const [groupedChunks, setGroupedChunks] = useState<Record<string, Chunk[]>>({})
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  // Группировка чанков по топикам
  useEffect(() => {
    if (!chunks) {
      setGroupedChunks({})
      return
    }

    const grouped: Record<string, Chunk[]> = {}
    
    chunks.forEach(chunk => {
      // Извлекаем топик из текста (первое предложение или первые 50 символов)
      const topic = extractTopic(chunk.preview)
      if (!grouped[topic]) {
        grouped[topic] = []
      }
      grouped[topic].push(chunk)
    })

    setGroupedChunks(grouped)
    // Автоматически разворачиваем все топики
    setExpandedTopics(new Set(Object.keys(grouped)))
  }, [chunks])

  const extractTopic = (text: string): string => {
    // Берем первое предложение или первые 50 символов
    const firstSentence = text.split(/[.!?]/)[0].trim()
    if (firstSentence.length > 50) {
      return firstSentence.substring(0, 50) + '...'
    }
    return firstSentence || 'Без названия'
  }

  const toggleTopic = (topic: string) => {
    const newExpanded = new Set(expandedTopics)
    if (newExpanded.has(topic)) {
      newExpanded.delete(topic)
    } else {
      newExpanded.add(topic)
    }
    setExpandedTopics(newExpanded)
  }

  const filteredTopics = Object.entries(groupedChunks).filter(([topic]) =>
    topic.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        maxWidth: '900px',
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
            <h2 style={{ margin: 0, fontSize: '20px' }}>Чанки документа</h2>
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

        {/* Search */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <input
            type="text"
            placeholder="Поиск по топикам..."
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

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Загрузка чанков...
            </div>
          ) : filteredTopics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              {searchTerm ? 'Топики не найдены' : 'Чанки не найдены'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredTopics.map(([topic, topicChunks]) => (
                <div key={topic} style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden'
                }}>
                  {/* Topic Header */}
                  <div
                    onClick={() => toggleTopic(topic)}
                    style={{
                      background: 'var(--surface-hover)',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: expandedTopics.has(topic) ? '1px solid var(--border)' : 'none'
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                        {topic}
                      </h3>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {topicChunks.length} чанк{topicChunks.length === 1 ? '' : topicChunks.length < 5 ? 'а' : 'ов'}
                      </p>
                    </div>
                    <div style={{
                      fontSize: '18px',
                      color: 'var(--text-muted)',
                      transform: expandedTopics.has(topic) ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}>
                      ▶
                    </div>
                  </div>

                  {/* Topic Chunks */}
                  {expandedTopics.has(topic) && (
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {topicChunks.map((chunk) => (
                          <div key={chunk.id} style={{
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius)',
                            padding: '12px',
                            background: 'var(--surface)'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '8px'
                            }}>
                              <div style={{
                                fontSize: '12px',
                                color: 'var(--text-muted)',
                                fontFamily: 'monospace'
                              }}>
                                #{chunk.id}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: 'var(--text-secondary)'
                              }}>
                                {chunk.page ? `стр. ${chunk.page}` : 'стр. —'} · {chunk.start ?? '?'}-{chunk.end ?? '?'}
                              </div>
                            </div>
                            <div style={{
                              whiteSpace: 'pre-wrap',
                              fontSize: '14px',
                              lineHeight: '1.5',
                              color: 'var(--text-primary)'
                            }}>
                              {chunk.preview}
                            </div>
                          </div>
                        ))}
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
            Всего топиков: {filteredTopics.length}
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
