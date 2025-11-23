'use client'

import { useEffect, useState } from 'react'

interface Campaign {
    id: string
    name: string
    description: string
    start_date: string
    end_date: string
    is_active: boolean
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: ''
    })

    useEffect(() => {
        fetchCampaigns()
    }, [])

    const fetchCampaigns = async () => {
        try {
            const token = localStorage.getItem('admin-token')
            const res = await fetch('/api/admin/campaigns', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setCampaigns(data.campaigns || [])
            }
        } catch (error) {
            console.error('Failed to fetch campaigns:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('admin-token')
            const url = editingId
                ? `/api/admin/campaigns/${editingId}`
                : '/api/admin/campaigns'

            const method = editingId ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setShowForm(false)
                setEditingId(null)
                setFormData({ name: '', description: '', start_date: '', end_date: '' })
                fetchCampaigns()
            }
        } catch (error) {
            console.error('Failed to save campaign:', error)
        }
    }

    const handleEdit = (campaign: Campaign) => {
        setEditingId(campaign.id)
        setFormData({
            name: campaign.name,
            description: campaign.description || '',
            start_date: campaign.start_date.split('T')[0],
            end_date: campaign.end_date.split('T')[0]
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa chiến dịch này?')) return

        try {
            const token = localStorage.getItem('admin-token')
            await fetch(`/api/admin/campaigns/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            fetchCampaigns()
        } catch (error) {
            console.error('Failed to delete campaign:', error)
        }
    }

    const toggleCampaign = async (id: string, isActive: boolean) => {
        try {
            const token = localStorage.getItem('admin-token')
            await fetch(`/api/admin/campaigns/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_active: !isActive })
            })
            fetchCampaigns()
        } catch (error) {
            console.error('Failed to toggle campaign:', error)
        }
    }

    const openCreateForm = () => {
        setEditingId(null)
        setFormData({ name: '', description: '', start_date: '', end_date: '' })
        setShowForm(true)
    }

    if (loading) {
        return <div className="text-white">Đang tải...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">📅 Chiến dịch</h1>
                    <p className="text-gray-400">Quản lý các chiến dịch marketing</p>
                </div>
                <button
                    onClick={openCreateForm}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <span>+</span> Tạo chiến dịch
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-2xl border border-gray-700">
                        <h2 className="text-xl font-bold text-white mb-4">
                            {editingId ? 'Chỉnh sửa chiến dịch' : 'Tạo chiến dịch mới'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Tên chiến dịch</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ví dụ: Giáng Sinh 2025"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Mô tả ngắn về chiến dịch..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 mb-2 text-sm">Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2 text-sm">Ngày kết thúc</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingId ? 'Cập nhật' : 'Tạo mới'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Campaigns List */}
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                {campaigns.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-3">📅</div>
                        <p className="text-gray-400">Chưa có chiến dịch nào</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700">
                        {campaigns.map((campaign) => (
                            <div
                                key={campaign.id}
                                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-700/30 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-white font-bold text-lg">{campaign.name}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${campaign.is_active
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
                                            }`}>
                                            {campaign.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-2">{campaign.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            🕒 {new Date(campaign.start_date).toLocaleDateString('vi-VN')}
                                        </span>
                                        <span>→</span>
                                        <span className="flex items-center gap-1">
                                            🏁 {new Date(campaign.end_date).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Toggle Switch */}
                                    <button
                                        onClick={() => toggleCampaign(campaign.id, campaign.is_active)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${campaign.is_active ? 'bg-green-600' : 'bg-gray-600'
                                            }`}
                                        title={campaign.is_active ? 'Tắt chiến dịch' : 'Bật chiến dịch'}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${campaign.is_active ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>

                                    {/* Edit Button */}
                                    <button
                                        onClick={() => handleEdit(campaign)}
                                        className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                                        title="Chỉnh sửa"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                        </svg>
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => handleDelete(campaign.id)}
                                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        title="Xóa"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
