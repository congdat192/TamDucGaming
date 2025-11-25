'use client'

import { useState, useEffect } from 'react'
import { replaceTemplateVariables } from '@/lib/emailService'

interface EmailLog {
  id: string
  to_email: string
  subject: string
  email_type: string
  provider: string
  status: string
  message_id: string | null
  error_message: string | null
  user_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

interface Stats {
  total: number
  success: number
  failed: number
  byProvider: {
    resend: number
    gmail: number
  }
}

interface EmailTemplate {
  subject: string
  htmlTemplate: string
  fromName: string
  fromEmail: string
}

// Modal to show email details
function EmailDetailModal({ log, onClose }: { log: EmailLog; onClose: () => void }) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const reconstructEmail = async () => {
      setLoading(true)
      try {
        // 1. Get template based on email_type
        // In a real app, we might fetch this from an API if templates are dynamic
        // For now, we'll fetch from a new API endpoint or just use hardcoded templates if they were client-side
        // But templates are in DB/server-side. Let's fetch from an API.
        // We'll create a simple server action or API route to get template content?
        // Or simpler: The user wants to see the content.
        // If we stored variables in metadata, we can try to reconstruct it.

        // Let's fetch the template via a new API or reuse existing structure.
        // Since we don't have a direct "get template" API for frontend yet, 
        // we will try to fetch it.

        const res = await fetch(`/api/admin/email-templates?type=${log.email_type}`)
        if (res.ok) {
          const data = await res.json()
          if (data.template) {
            const template = data.template as EmailTemplate
            const variables = (log.metadata?.variables as Record<string, string | number>) || {}

            // Reconstruct HTML
            let html = template.htmlTemplate
            for (const [key, value] of Object.entries(variables)) {
              const regex = new RegExp(`{{${key}}}`, 'g')
              html = html.replace(regex, String(value))
            }
            setContent(html)
          } else {
            setContent('<div class="p-4 text-red-400">Không tìm thấy template cho loại email này.</div>')
          }
        } else {
          setContent('<div class="p-4 text-red-400">Lỗi khi tải template.</div>')
        }

      } catch (error) {
        console.error('Error reconstructing email:', error)
        setContent('<div class="p-4 text-red-400">Đã xảy ra lỗi khi tái tạo nội dung email.</div>')
      } finally {
        setLoading(false)
      }
    }

    if (log) {
      reconstructEmail()
    }
  }, [log])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gray-800/50 rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{log.subject}</h3>
            <div className="flex gap-2 text-sm text-gray-400">
              <span>To: <span className="text-white">{log.to_email}</span></span>
              <span>•</span>
              <span>{new Date(log.created_at).toLocaleString('vi-VN')}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-500">
              Đang tải nội dung...
            </div>
          ) : (
            <div
              className="prose max-w-none text-black"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-gray-800/50 rounded-b-2xl flex justify-between items-center text-xs text-gray-500">
          <div>
            ID: {log.id} | Provider: {log.provider}
          </div>
          <div>
            Metadata: {JSON.stringify(log.metadata)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminEmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ total: 0, success: 0, failed: 0, byProvider: { resend: 0, gmail: 0 } })
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)

  // Filters
  const [filterType, setFilterType] = useState('')
  const [filterProvider, setFilterProvider] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchEmail, setSearchEmail] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [pagination.page, filterType, filterProvider, filterStatus])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (filterType) params.append('type', filterType)
      if (filterProvider) params.append('provider', filterProvider)
      if (filterStatus) params.append('status', filterStatus)
      if (searchEmail) params.append('search', searchEmail)

      const res = await fetch(`/api/admin/email-logs?${params}`)
      const data = await res.json()

      if (data.success) {
        setLogs(data.logs || [])
        setPagination(data.pagination)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch email logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchLogs()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      otp: { text: 'OTP', color: 'bg-blue-500' },
      referral_bonus: { text: 'Referral Bonus', color: 'bg-green-500' },
      referral_completion: { text: 'Referral Done', color: 'bg-emerald-500' },
      voucher_claim: { text: 'Voucher', color: 'bg-yellow-500' },
      test: { text: 'Test', color: 'bg-purple-500' },
      unknown: { text: 'Khác', color: 'bg-gray-500' }
    }
    return labels[type] || { text: type, color: 'bg-gray-500' }
  }

  const getProviderLabel = (provider: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      resend: { text: 'Resend', color: 'bg-indigo-500' },
      gmail: { text: 'Gmail', color: 'bg-red-500' },
      none: { text: 'Không có', color: 'bg-gray-600' }
    }
    return labels[provider] || { text: provider, color: 'bg-gray-500' }
  }

  const getStatusLabel = (status: string) => {
    return status === 'success'
      ? { text: 'Thành công', color: 'text-green-400' }
      : { text: 'Thất bại', color: 'text-red-400' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">📧 Email Logs</h1>
        <p className="text-gray-400">Theo dõi lịch sử gửi email từ hệ thống</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
          <div className="text-gray-400 text-sm">Tổng email</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
          <div className="text-gray-400 text-sm">Thành công</div>
          <div className="text-2xl font-bold text-green-400">{stats.success}</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
          <div className="text-gray-400 text-sm">Thất bại</div>
          <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
          <div className="text-gray-400 text-sm">Qua Resend</div>
          <div className="text-2xl font-bold text-indigo-400">{stats.byProvider.resend}</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
          <div className="text-gray-400 text-sm">Qua Gmail</div>
          <div className="text-2xl font-bold text-red-400">{stats.byProvider.gmail}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-gray-400 text-xs mb-1">Loại email</label>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
              className="px-3 py-2 bg-gray-700 rounded-lg text-white text-sm focus:outline-none"
            >
              <option value="">Tất cả</option>
              <option value="otp">OTP</option>
              <option value="referral_bonus">Referral Bonus</option>
              <option value="referral_completion">Referral Done</option>
              <option value="voucher_claim">Voucher</option>
              <option value="test">Test</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1">Provider</label>
            <select
              value={filterProvider}
              onChange={(e) => { setFilterProvider(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
              className="px-3 py-2 bg-gray-700 rounded-lg text-white text-sm focus:outline-none"
            >
              <option value="">Tất cả</option>
              <option value="resend">Resend</option>
              <option value="gmail">Gmail</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1">Trạng thái</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
              className="px-3 py-2 bg-gray-700 rounded-lg text-white text-sm focus:outline-none"
            >
              <option value="">Tất cả</option>
              <option value="success">Thành công</option>
              <option value="failed">Thất bại</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-400 text-xs mb-1">Tìm email</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="example@email.com"
                className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-white text-sm focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Tìm
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-800/50 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Danh sách email ({pagination.total})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">📧</div>
            <p>Chưa có email logs nào</p>
            <p className="text-sm mt-1">Chạy SQL migration trước để tạo bảng email_logs</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Thời gian</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Loại</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tiêu đề</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => {
                  const typeInfo = getTypeLabel(log.email_type)
                  const providerInfo = getProviderLabel(log.provider)
                  const statusInfo = getStatusLabel(log.status)

                  return (
                    <tr key={log.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium text-white rounded ${typeInfo.color}`}>
                          {typeInfo.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white text-sm">
                        {log.to_email}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm max-w-xs truncate" title={log.subject}>
                        {log.subject}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium text-white rounded ${providerInfo.color}`}>
                          {providerInfo.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                        {log.error_message && (
                          <div className="text-xs text-red-400 mt-1 truncate max-w-xs" title={log.error_message}>
                            {log.error_message}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              Trang {pagination.page} / {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <h3 className="text-yellow-400 font-semibold mb-2">📝 Hướng dẫn</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• <strong>Resend:</strong> Provider chính (100 email/ngày miễn phí)</li>
          <li>• <strong>Gmail:</strong> Fallback khi Resend hết quota (~500 email/ngày)</li>
          <li>• Email logs được tự động lưu khi gửi email từ hệ thống</li>
          <li>• Nếu chưa thấy logs, hãy chạy SQL migration để tạo bảng</li>
        </ul>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <EmailDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  )
}
