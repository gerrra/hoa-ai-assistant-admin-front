import React, { useEffect, useState } from 'react'
import { listLogs } from '../shared/adminApi'
import { useNavigate } from 'react-router-dom'

export default function LogsPage() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const reloadLogs = async () => {
    setLoading(true)
    try {
      setLogs(await listLogs(100))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reloadLogs()
  }, [])

  return (
    <div className="wrap">
      {/* Header */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>Логи запросов</h1>
            <p className="muted" style={{ margin: '4px 0 0 0' }}>История всех запросов к системе</p>
          </div>
          <div className="row" style={{ alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate('/')} className="btn-secondary">
              ← Назад к документам
            </button>
            <button onClick={reloadLogs} className="btn-secondary" disabled={loading}>
              {loading ? 'Обновляю...' : '🔄 Обновить'}
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
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
                {logs.map((l, i) => (
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
    </div>
  )
}
