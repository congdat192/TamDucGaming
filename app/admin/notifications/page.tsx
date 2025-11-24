'use client'

import { useState, useEffect } from 'react'

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  data: Record<string, unknown>
  created_at: string
  users?: {
    phone: string
    email: string
  }
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  // Form state
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [targetType, setTargetType] = useState<'all' | 'active'>('all')

  useEffect(() => {
    fetchNotifications()
  }, [page])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/notifications?page=${page}&limit=20`)
      const data = await res.json()

      if (data.notifications) {
        setNotifications(data.notifications)
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !message.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          targetType
        })
      })

      const data = await res.json()

      if (data.success) {
        alert(`Đã gửi thông báo đến ${data.sent} người dùng!`)
        setShowSendModal(false)
        setTitle('')
        setMessage('')
        fetchNotifications()
      } else {
        alert(data.error || 'Không thể gửi thông báo')
      }
    } catch (error) {
      console.error('Failed to send notification:', error)
      alert('Đã xảy ra lỗi')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return

    try {
      const res = await fetch(`/api/admin/notifications?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      referral_bonus: { text: 'Referral', color: 'bg-green-500' },
      voucher_available: { text: 'Voucher', color: 'bg-yellow-500' },
      points_reminder: { text: 'Điểm', color: 'bg-blue-500' },
      system: { text: 'Hệ thống', color: 'bg-purple-500' },
      admin_broadcast: { text: 'Admin', color: 'bg-red-500' }
    }
    return labels[type] || { text: type, color: 'bg-gray-500' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">🔔 Quản lý Thông báo</h1>
          <p className="text-gray-400">Gửi và quản lý thông báo đến người dùng</p>
        </div>
        <button
          onClick={() => setShowSendModal(true)}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Gửi thông báo mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
          <div className="text-gray-400 text-sm">Tổng thông báo</div>
          <div className="text-2xl font-bold text-white">{total}</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
          <div className="text-gray-400 text-sm">Chưa đọc</div>
          <div className="text-2xl font-bold text-blue-400">
            {notifications.filter(n => !n.is_read).length}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
          <div className="text-gray-400 text-sm">Đã đọc</div>
          <div className="text-2xl font-bold text-green-400">
            {notifications.filter(n => n.is_read).length}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-gray-800/50 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Danh sách thông báo</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">🔔</div>
            <p>Chưa có thông báo nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Loại</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tiêu đề</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Người nhận</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Thời gian</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {notifications.map((notification) => {
                  const typeInfo = getTypeLabel(notification.type)
                  return (
                    <tr key={notification.id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium text-white rounded ${typeInfo.color}`}>
                          {typeInfo.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{notification.title}</div>
                        <div className="text-gray-400 text-sm truncate max-w-xs">{notification.message}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {notification.users?.email || notification.users?.phone || notification.user_id.slice(0, 8) + '...'}
                      </td>
                      <td className="px-4 py-3">
                        {notification.is_read ? (
                          <span className="text-green-400 text-sm">Đã đọc</span>
                        ) : (
                          <span className="text-yellow-400 text-sm">Chưa đọc</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {formatDate(notification.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Xóa"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
        {total > 20 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              Trang {page} / {Math.ceil(total / 20)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 20 >= total}
                className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Send Notification Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Gửi thông báo mới</h2>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Tiêu đề *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Thông báo quan trọng"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Nội dung *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Nhập nội dung thông báo..."
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Gửi đến</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      value="all"
                      checked={targetType === 'all'}
                      onChange={() => setTargetType('all')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-white">Tất cả người dùng</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      value="active"
                      checked={targetType === 'active'}
                      onChange={() => setTargetType('active')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-white">Hoạt động 7 ngày qua</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {sending ? 'Đang gửi...' : 'Gửi thông báo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
