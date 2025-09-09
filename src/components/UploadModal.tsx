import React, { useState, useEffect } from 'react'
import { uploadDocument, listCommunities } from '../shared/adminApi'

type UploadModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: (result: any) => void
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [loading, setLoading] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [autoModeNotice, setAutoModeNotice] = useState('')
  const [status, setStatus] = useState('')
  const [communities, setCommunities] = useState<Array<{id: number; name: string; description: string}>>([])
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('')

  // Загружаем список сообществ при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      loadCommunities()
    }
  }, [isOpen])

  const loadCommunities = async () => {
    try {
      const data = await listCommunities()
      setCommunities(data)
    } catch (err) {
      console.error('Ошибка загрузки сообществ:', err)
    }
  }

  const validateFileSize = (file: File): boolean => {
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (file.size > maxSize) {
      setStatus('❌ Файл слишком большой. Максимальный размер: 25MB')
      return false
    }
    return true
  }

  const onUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const file = fd.get('file') as File
    
    // Валидация выбора сообщества
    if (!selectedCommunityId) {
      setStatus('❌ Выберите сообщество')
      return
    }
    
    // Валидация размера файла
    if (!file || !validateFileSize(file)) {
      return
    }

    // Добавляем community_id в FormData
    fd.set('community_id', selectedCommunityId)

    // Сброс состояний
    setShowProgress(false)
    setUploadProgress(0)
    setAutoModeNotice('')
    setStatus('')

    // Показываем прогресс для больших файлов
    if (file.size > 5 * 1024 * 1024) { // 5MB
      setShowProgress(true)
      setStatus('⏳ Обработка большого файла... Это может занять несколько минут')
    } else {
      setStatus('⏳ Обработка документа...')
    }

    // Предупреждение для очень больших файлов
    if (file.size > 10 * 1024 * 1024) { // 10MB
      setAutoModeNotice('💡 Рекомендуется использовать режим "Smart" для файлов больше 10MB')
    }

    // community_id теперь берется из формы
    setLoading(true)
    
    // Симуляция прогресса для больших файлов
    let progressInterval: NodeJS.Timeout | null = null
    if (file.size > 5 * 1024 * 1024) {
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 1000)
    }
    
    try {
      const r = await uploadDocument(fd)
      setUploadProgress(100)
      onSuccess(r)
      onClose()
    } catch (err: any) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setStatus('❌ Загрузка отменена по таймауту. Для больших файлов рекомендуется использовать режим "Smart" в предпросмотре.')
      } else if (err.response?.status === 413) {
        setStatus('❌ Файл слишком большой. Максимальный размер: 25MB')
      } else if (err.response?.status === 500) {
        setStatus('❌ Ошибка сервера при обработке файла. Попробуйте файл меньшего размера или используйте режим "Smart".')
      } else {
        setStatus(`❌ Ошибка загрузки: ${err.message || 'Неизвестная ошибка'}`)
      }
    } finally {
      setLoading(false)
      setShowProgress(false)
      setUploadProgress(0)
      if (progressInterval) {
        clearInterval(progressInterval)
      }
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
        maxWidth: '600px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Загрузка документа</h2>
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

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px'
        }}>
          {/* Status Messages */}
          {status && (
            <div className={`status ${status.includes('успешно') ? 'success' : status.includes('Ошибка') || status.includes('❌') ? 'error' : 'info'}`}>
              {status}
            </div>
          )}

          {/* Auto Mode Notice */}
          {autoModeNotice && (
            <div className="auto-mode-notice">
              {autoModeNotice}
            </div>
          )}

          {/* Progress Indicator */}
          {showProgress && (
            <div className="progress-indicator">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <div className="progress-text">
                Обработка большого файла... {Math.round(uploadProgress)}%
              </div>
            </div>
          )}

          <form onSubmit={onUpload} className="col" style={{ maxWidth: '100%' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: 'var(--text-primary)'
              }}>
                Сообщество *
              </label>
              <select
                value={selectedCommunityId}
                onChange={(e) => setSelectedCommunityId(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="">Выберите сообщество</option>
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
                display: 'flex', 
                alignItems: 'center',
                gap: '8px',
                marginBottom: '6px', 
                fontSize: '14px', 
                fontWeight: '500',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                lineHeight: '1.4'
              }}>
                <input 
                  type="checkbox" 
                  name="use_topic_analysis" 
                  defaultChecked
                  disabled={loading}
                  style={{ 
                    margin: 0,
                    width: '16px',
                    height: '16px',
                    flexShrink: 0
                  }}
                />
                Использовать анализ топиков
              </label>
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
                  setAutoModeNotice('')
                  
                  if (file) {
                    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
                    
                    if (file.size > 25 * 1024 * 1024) {
                      setStatus('❌ Файл слишком большой. Максимальный размер: 25MB')
                    } else if (file.size > 10 * 1024 * 1024) {
                      setStatus(`⚠️ Большой файл выбран (${fileSizeMB} MB). Обработка может занять несколько минут...`)
                      setAutoModeNotice('💡 Рекомендуется использовать режим "Smart" для лучшей производительности')
                    } else if (file.size > 5 * 1024 * 1024) {
                      setStatus(`📄 Файл среднего размера (${fileSizeMB} MB). Обработка может занять время...`)
                    } else {
                      setStatus('')
                    }
                  } else {
                    setStatus('')
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
          
        </div>
      </div>
    </div>
  )
}
