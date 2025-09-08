import React, { useState, useEffect } from 'react'
import { generateTopicTitle } from '../shared/adminApi'

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
  const [generatingTopics, setGeneratingTopics] = useState(false)

  // Группировка чанков по топикам
  useEffect(() => {
    if (!chunks) {
      setGroupedChunks({})
      return
    }

    const groupChunks = async () => {
      setGeneratingTopics(true)
      const grouped: Record<string, Chunk[]> = {}
      
      // Сначала группируем по базовым топикам
      for (const chunk of chunks) {
        const topic = extractTopic(chunk.preview)
        if (!grouped[topic]) {
          grouped[topic] = []
        }
        grouped[topic].push(chunk)
      }

      // Показываем базовую группировку сразу
      setGroupedChunks(grouped)
      setExpandedTopics(new Set())

      // Теперь улучшаем названия топиков через ИИ
      const improvedGrouped: Record<string, Chunk[]> = {}
      const topicPromises = Object.entries(grouped).map(async ([topic, topicChunks]) => {
        try {
          // Объединяем текст всех чанков в топике для лучшего понимания контекста
          const combinedText = topicChunks.map(c => c.preview).join(' ').substring(0, 1000)
          const aiResponse = await generateTopicTitle(combinedText)
          const improvedTopic = aiResponse.title || topic
          return { topic: improvedTopic, chunks: topicChunks }
        } catch (error) {
          console.warn('Failed to generate AI topic title:', error)
          return { topic, chunks: topicChunks }
        }
      })

      const results = await Promise.all(topicPromises)
      
      results.forEach(({ topic, chunks }) => {
        improvedGrouped[topic] = chunks
      })

      setGroupedChunks(improvedGrouped)
      setGeneratingTopics(false)
    }

    groupChunks()
  }, [chunks])

  const extractTopic = (text: string): string => {
    // Улучшенная логика извлечения топика
    const cleanText = text.trim()
    
    // Ищем ключевые слова и фразы
    const keywords = [
      'правила', 'политика', 'условия', 'ограничения', 'требования',
      'обязанности', 'права', 'ответственность', 'штрафы', 'санкции',
      'управление', 'администрация', 'совет', 'правление', 'комитет',
      'собственность', 'недвижимость', 'квартира', 'дом', 'участок',
      'платежи', 'взносы', 'сборы', 'налоги', 'расходы',
      'ремонт', 'обслуживание', 'уборка', 'благоустройство',
      'парковка', 'стоянка', 'гараж', 'место',
      'жильцы', 'соседи', 'гости', 'посетители',
      'шум', 'тишина', 'порядок', 'чистота',
      'животные', 'питомцы', 'собаки', 'кошки',
      'курение', 'алкоголь', 'вечеринки', 'мероприятия'
    ]
    
    // Ищем первое упоминание ключевого слова
    for (const keyword of keywords) {
      const index = cleanText.toLowerCase().indexOf(keyword.toLowerCase())
      if (index !== -1) {
        // Берем контекст вокруг ключевого слова
        const start = Math.max(0, index - 20)
        const end = Math.min(cleanText.length, index + keyword.length + 30)
        let topic = cleanText.substring(start, end).trim()
        
        // Очищаем и форматируем
        topic = topic.replace(/^[^\w\u0400-\u04FF]*/, '') // убираем знаки в начале
        topic = topic.replace(/[^\w\u0400-\u04FF\s]*$/, '') // убираем знаки в конце
        
        if (topic.length > 60) {
          topic = topic.substring(0, 60) + '...'
        }
        
        return topic || 'Общие положения'
      }
    }
    
    // Если ключевых слов не найдено, берем первое предложение
    const firstSentence = cleanText.split(/[.!?]/)[0].trim()
    if (firstSentence.length > 50) {
      return firstSentence.substring(0, 50) + '...'
    }
    
    return firstSentence || 'Общие положения'
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
            <>
              {generatingTopics && (
                <div style={{
                  background: 'var(--primary-light)',
                  border: '1px solid var(--primary)',
                  borderRadius: 'var(--radius)',
                  padding: '12px',
                  marginBottom: '16px',
                  textAlign: 'center',
                  color: 'var(--primary)',
                  fontSize: '14px'
                }}>
                  🤖 Генерирую умные названия топиков...
                </div>
              )}
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
            </>
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
