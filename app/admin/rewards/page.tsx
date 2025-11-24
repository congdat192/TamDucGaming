'use client'

import { useState, useEffect } from 'react'

interface Reward {
  id: string
  name: string
  description: string
  type: 'voucher' | 'gift'
  value: number
  points_required: number
  image_url: string | null
  stock: number
  is_active: boolean
  created_at: string
}

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'gift' as 'voucher' | 'gift',
    value: 0,
    points_required: 0,
    image_url: '',
    stock: 0
  })

  useEffect(() => {
    loadRewards()
  }, [])

  const loadRewards = async () => {
    try {
      const res = await fetch('/api/admin/rewards')
      const data = await res.json()
      setRewards(data.rewards || [])
    } catch (err) {
      console.error('Failed to load rewards:', err)
      setError('Không thể tải danh sách quà tặng')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'gift',
      value: 0,
      points_required: 0,
      image_url: '',
      stock: 0
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (reward: Reward) => {
    setFormData({
      name: reward.name,
      description: reward.description,
      type: reward.type,
      value: reward.value,
      points_required: reward.points_required,
      image_url: reward.image_url || '',
      stock: reward.stock
    })
    setEditingId(reward.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { ...formData, id: editingId } : formData

      const res = await fetch('/api/admin/rewards', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Không thể lưu')
      }

      setSuccess(editingId ? 'Cập nhật thành công!' : 'Tạo mới thành công!')
      resetForm()
      loadRewards()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (reward: Reward) => {
    try {
      const res = await fetch('/api/admin/rewards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reward.id, is_active: !reward.is_active })
      })

      if (res.ok) {
        loadRewards()
      }
    } catch (err) {
      console.error('Toggle active error:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa quà tặng này?')) return

    try {
      const res = await fetch(`/api/admin/rewards?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setSuccess('Đã xóa quà tặng')
        loadRewards()
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Không thể xóa')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">🎁 Quản lý Quà tặng</h1>
          <p className="text-gray-400">Thêm, sửa, xóa quà tặng cho người chơi</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all"
        >
          + Thêm quà tặng
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-6">
          {success}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingId ? 'Sửa quà tặng' : 'Thêm quà tặng mới'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Tên quà tặng *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Loại *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'voucher' | 'gift' })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  >
                    <option value="gift">Quà tặng vật lý</option>
                    <option value="voucher">Voucher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Giá trị (VNĐ)</label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Điểm cần đổi *</label>
                  <input
                    type="number"
                    value={formData.points_required}
                    onChange={(e) => setFormData({ ...formData, points_required: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Số lượng còn</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">URL hình ảnh</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rewards Table */}
      <div className="bg-gray-800/50 rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Quà tặng</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Loại</th>
              <th className="text-right px-6 py-4 text-gray-400 font-medium">Điểm</th>
              <th className="text-right px-6 py-4 text-gray-400 font-medium">Giá trị</th>
              <th className="text-right px-6 py-4 text-gray-400 font-medium">Còn lại</th>
              <th className="text-center px-6 py-4 text-gray-400 font-medium">Trạng thái</th>
              <th className="text-right px-6 py-4 text-gray-400 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rewards.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  Chưa có quà tặng nào. Nhấn &quot;Thêm quà tặng&quot; để bắt đầu.
                </td>
              </tr>
            ) : (
              rewards.map((reward) => (
                <tr key={reward.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-xl">
                        {reward.type === 'voucher' ? '🎟️' : '🎁'}
                      </div>
                      <div>
                        <div className="text-white font-medium">{reward.name}</div>
                        <div className="text-gray-500 text-sm truncate max-w-[200px]">
                          {reward.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-xs ${
                      reward.type === 'voucher'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {reward.type === 'voucher' ? 'Voucher' : 'Quà vật lý'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-yellow-400 font-bold">{reward.points_required}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-green-400">{reward.value.toLocaleString()}đ</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={reward.stock > 0 ? 'text-white' : 'text-red-400'}>
                      {reward.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleActive(reward)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        reward.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {reward.is_active ? 'Đang bật' : 'Đã tắt'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(reward)}
                        className="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg text-sm hover:bg-blue-600/30"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(reward.id)}
                        className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
