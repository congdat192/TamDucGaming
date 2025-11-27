'use client'

import { useEffect, useState } from 'react'

interface SuspiciousSession {
  id: string
  user_id: string
  game_token: string
  status: string
  start_time: string
  end_time: string | null
  client_score: number | null
  validated_score: number | null
  client_duration_seconds: number | null
  suspicion_reason: string | null
  ip_hash: string | null
  user_agent: string | null
  user?: {
    phone: string | null
    email: string | null
    name: string | null
  }
}

interface Stats {
  totalSuspicious: number
  totalBlocked: number
  totalScoreReduced: number
}

export default function SuspiciousSessionsPage() {
  const [sessions, setSessions] = useState<SuspiciousSession[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'suspicious' | 'invalid'>('suspicious')

  useEffect(() => {
    fetchSessions()
  }, [filter])

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('admin-token')
      const res = await fetch(`/api/admin/suspicious-sessions?filter=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsInvalid = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('admin-token')
      const res = await fetch(`/api/admin/suspicious-sessions/${sessionId}/invalidate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchSessions()
      }
    } catch (error) {
      console.error('Failed to mark session:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const maskIdentifier = (value: string | null) => {
    if (!value) return '—'
    if (value.includes('@')) {
      const [name, domain] = value.split('@')
      return `${name.slice(0, 3)}***@${domain}`
    }
    return value.slice(0, 4) + '****' + value.slice(-3)
  }

  if (loading) {
    return <div className="text-white">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">🚨 Phiên chơi nghi vấn</h1>
        <p className="text-gray-400">Theo dõi và quản lý các phiên chơi có dấu hiệu gian lận</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-4">
            <div className="text-red-300 text-sm mb-1">Tổng phiên nghi vấn</div>
            <div className="text-2xl font-bold text-white">{stats.totalSuspicious}</div>
          </div>
          <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-4">
            <div className="text-yellow-300 text-sm mb-1">Điểm bị giảm</div>
            <div className="text-2xl font-bold text-white">{stats.totalScoreReduced}</div>
          </div>
          <div className="bg-gray-600/20 border border-gray-500/30 rounded-xl p-4">
            <div className="text-gray-300 text-sm mb-1">Phiên bị vô hiệu</div>
            <div className="text-2xl font-bold text-white">{stats.totalBlocked}</div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('suspicious')}
          className={`px-4 py-2 rounded-lg transition ${filter === 'suspicious'
            ? 'bg-red-600 text-white'
            : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
        >
          Nghi vấn
        </button>
        <button
          onClick={() => setFilter('invalid')}
          className={`px-4 py-2 rounded-lg transition ${filter === 'invalid'
            ? 'bg-gray-600 text-white'
            : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
        >
          Đã vô hiệu
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition ${filter === 'all'
            ? 'bg-blue-600 text-white'
            : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
        >
          Tất cả
        </button>
      </div>

      {/* Sessions Table */}
      <div className="bg-gray-800/50 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Client Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Validated
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Lý do nghi vấn
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Không có phiên chơi nào
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">
                        {maskIdentifier(session.user?.email || session.user?.phone || session.user_id.slice(0, 8))}
                      </div>
                      <div className="text-xs text-gray-500">{session.user?.name || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {formatDate(session.start_time)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-yellow-400">
                        {session.client_score ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-mono ${session.validated_score !== session.client_score
                        ? 'text-red-400'
                        : 'text-green-400'
                        }`}>
                        {session.validated_score ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {session.client_duration_seconds ? `${session.client_duration_seconds}s` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-red-300 max-w-xs truncate" title={session.suspicion_reason || ''}>
                        {session.suspicion_reason || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${session.status === 'invalid'
                        ? 'bg-gray-600/50 text-gray-300'
                        : session.status === 'finished'
                          ? 'bg-green-600/50 text-green-300'
                          : 'bg-yellow-600/50 text-yellow-300'
                        }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {session.status !== 'invalid' && (
                        <button
                          onClick={() => markAsInvalid(session.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition"
                        >
                          Vô hiệu
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-800/30 rounded-lg p-4 text-sm text-gray-400">
        <div className="font-medium text-white mb-2">Giải thích:</div>
        <ul className="space-y-1">
          <li>• <span className="text-yellow-400">Client Score</span>: Điểm client gửi lên (chưa validate)</li>
          <li>• <span className="text-green-400">Validated</span>: Điểm server đã xác nhận (dùng cho leaderboard)</li>
          <li>• Nếu Validated ≠ Client Score → điểm đã bị điều chỉnh do nghi vấn gian lận</li>
          <li>• Phiên <span className="text-gray-300">invalid</span> = đã bị vô hiệu hóa, không tính điểm</li>
        </ul>
      </div>
    </div>
  )
}
