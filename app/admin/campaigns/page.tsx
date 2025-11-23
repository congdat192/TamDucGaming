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
    const [newCampaign, setNewCampaign] = useState({
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

    const handleCreateCampaign = async () => {
        try {
            const token = localStorage.getItem('admin-token')
            const res = await fetch('/api/admin/campaigns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newCampaign)
            })

            if (res.ok) {
                setShowForm(false)
                setNewCampaign({ name: '', description: '', start_date: '', end_date: '' })
                fetchCampaigns()
            }
        } catch (error) {
            console.error('Failed to create campaign:', error)
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
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    {showForm ? 'Hủy' : '+ Tạo chiến dịch'}
                </button>
            </div>

            {/* Create Campaign Form */}
            {showForm && (
                <div className="bg-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Tạo chiến dịch mới</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Tên chiến dịch</label>
                            <input
                                type="text"
                                value={newCampaign.name}
                                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Mô tả</label>
                            <textarea
                                value={newCampaign.description}
                                onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Ngày bắt đầu</label>
                                <input
                                    type="date"
                                    value={newCampaign.start_date}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Ngày kết thúc</label>
                                <input
                                    type="date"
                                    value={newCampaign.end_date}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleCreateCampaign}
                            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Tạo chiến dịch
                        </button>
                    </div>
                </div>
            )}

            {/* Campaigns List */}
            <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Danh sách chiến dịch</h2>
                {campaigns.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">Chưa có chiến dịch nào</p>
                ) : (
                    <div className="space-y-4">
                        {campaigns.map((campaign) => (
                            <div
                                key={campaign.id}
                                className="bg-gray-700/50 rounded-lg p-4 flex justify-between items-center"
                            >
                                <div>
                                    <h3 className="text-white font-semibold">{campaign.name}</h3>
                                    <p className="text-gray-400 text-sm">{campaign.description}</p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => toggleCampaign(campaign.id, campaign.is_active)}
                                    className={`px-4 py-2 rounded-lg font-semibold ${campaign.is_active
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-600 text-gray-300'
                                        }`}
                                >
                                    {campaign.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
