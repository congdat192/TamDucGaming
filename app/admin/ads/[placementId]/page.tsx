'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import type { AdPlacement, AdContent } from '@/types/ads'

export default function AdminAdPlacementPage() {
    const router = useRouter()
    const params = useParams()
    const placementId = params.placementId as string

    const [placement, setPlacement] = useState<AdPlacement | null>(null)
    const [contents, setContents] = useState<AdContent[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        sponsor_name: '',
        logo_url: '',
        link_url: '',
        display_text: '',
        display_order: 0,
        start_date: '',
        end_date: ''
    })
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        if (placementId) {
            fetchPlacement()
            fetchContents()
        }
    }, [placementId])

    const fetchPlacement = async () => {
        try {
            const res = await fetch('/api/ads/placements')
            const data = await res.json()
            if (data.placements && data.placements.length > 0) {
                // Find the placement by ID
                const found = data.placements.find((p: AdPlacement) => p.id === placementId)
                if (found) {
                    setPlacement(found)
                }
            }
        } catch (error) {
            console.error('Failed to fetch placement:', error)
        }
    }

    const fetchContents = async () => {
        try {
            const res = await fetch(`/api/ads/contents?placement_id=${placementId}`)
            const data = await res.json()
            setContents(data.contents || [])
        } catch (error) {
            console.error('Failed to fetch contents:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/ads/upload-logo', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            if (data.success) {
                setFormData(prev => ({ ...prev, logo_url: data.url }))
                alert('Upload thành công!')
            } else {
                alert(data.error || 'Upload thất bại')
            }
        } catch (error) {
            console.error('Upload error:', error)
            alert('Upload thất bại')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.sponsor_name || !formData.logo_url) {
            alert('Vui lòng điền tên nhà tài trợ và upload logo')
            return
        }

        try {
            const url = editingId ? '/api/ads/contents' : '/api/ads/contents'
            const method = editingId ? 'PUT' : 'POST'
            const body = editingId
                ? { id: editingId, ...formData }
                : { placement_id: placementId, ...formData }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                alert(editingId ? 'Cập nhật thành công!' : 'Thêm thành công!')
                setShowAddForm(false)
                setEditingId(null)
                setFormData({
                    sponsor_name: '',
                    logo_url: '',
                    link_url: '',
                    display_text: '',
                    display_order: 0,
                    start_date: '',
                    end_date: ''
                })
                fetchContents()
            } else {
                alert('Có lỗi xảy ra')
            }
        } catch (error) {
            console.error('Submit error:', error)
            alert('Có lỗi xảy ra')
        }
    }

    const handleEdit = (content: AdContent) => {
        setFormData({
            sponsor_name: content.sponsor_name,
            logo_url: content.logo_url,
            link_url: content.link_url || '',
            display_text: content.display_text || '',
            display_order: content.display_order,
            start_date: content.start_date || '',
            end_date: content.end_date || ''
        })
        setEditingId(content.id)
        setShowAddForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa quảng cáo này?')) return

        try {
            const res = await fetch(`/api/ads/contents?id=${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                alert('Xóa thành công!')
                fetchContents()
            }
        } catch (error) {
            console.error('Delete error:', error)
            alert('Xóa thất bại')
        }
    }

    const toggleActive = async (content: AdContent) => {
        try {
            const res = await fetch('/api/ads/contents', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: content.id,
                    is_active: !content.is_active
                })
            })

            if (res.ok) {
                fetchContents()
            }
        } catch (error) {
            console.error('Toggle error:', error)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <button
                            onClick={() => router.push('/admin/ads')}
                            className="text-white/60 hover:text-white mb-2 flex items-center gap-2"
                        >
                            ← Quay lại
                        </button>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {placement?.title || 'Quản lý quảng cáo'}
                        </h1>
                        <p className="text-white/60">{placement?.description}</p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                        {showAddForm ? '✕ Đóng' : '+ Thêm quảng cáo'}
                    </button>
                </div>

                {/* Add/Edit Form */}
                {showAddForm && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {editingId ? 'Sửa quảng cáo' : 'Thêm quảng cáo mới'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white/80 text-sm mb-2">Tên nhà tài trợ *</label>
                                    <input
                                        type="text"
                                        value={formData.sponsor_name}
                                        onChange={(e) => setFormData({ ...formData, sponsor_name: e.target.value })}
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/80 text-sm mb-2">Link website</label>
                                    <input
                                        type="url"
                                        value={formData.link_url}
                                        onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-white/80 text-sm mb-2">Logo *</label>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/webp"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                        className="text-white/80 text-sm"
                                    />
                                    {uploading && <span className="text-white/60">Đang upload...</span>}
                                    {formData.logo_url && (
                                        <div className="relative w-16 h-16 bg-white/10 rounded-lg overflow-hidden">
                                            <Image src={formData.logo_url} alt="Preview" fill className="object-contain" unoptimized />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-white/80 text-sm mb-2">Text hiển thị</label>
                                <input
                                    type="text"
                                    value={formData.display_text}
                                    onChange={(e) => setFormData({ ...formData, display_text: e.target.value })}
                                    placeholder="VD: Tài trợ bởi..."
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-white/80 text-sm mb-2">Thứ tự hiển thị</label>
                                    <input
                                        type="number"
                                        value={formData.display_order}
                                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/80 text-sm mb-2">Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/80 text-sm mb-2">Ngày kết thúc</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                                >
                                    {editingId ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null)
                                            setFormData({
                                                sponsor_name: '',
                                                logo_url: '',
                                                link_url: '',
                                                display_text: '',
                                                display_order: 0,
                                                start_date: '',
                                                end_date: ''
                                            })
                                        }}
                                        className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                    >
                                        Hủy
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {/* Contents List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-white/60">Đang tải...</div>
                    </div>
                ) : contents.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">📢</div>
                        <div className="text-white/60">Chưa có quảng cáo nào</div>
                        <div className="text-white/40 text-sm mt-2">Click "Thêm quảng cáo" để bắt đầu</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contents.map((content) => (
                            <div
                                key={content.id}
                                className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border transition-all ${content.is_active ? 'border-green-400/30' : 'border-gray-500/30'
                                    }`}
                            >
                                {/* Logo */}
                                <div className="relative w-full h-32 bg-white/5 rounded-lg mb-3 overflow-hidden">
                                    <Image
                                        src={content.logo_url}
                                        alt={content.sponsor_name}
                                        fill
                                        className="object-contain p-2"
                                        unoptimized
                                    />
                                </div>

                                {/* Info */}
                                <h4 className="text-white font-bold mb-1">{content.sponsor_name}</h4>
                                {content.display_text && (
                                    <p className="text-white/60 text-sm mb-2">{content.display_text}</p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-white/50 mb-3">
                                    <span>Thứ tự: {content.display_order}</span>
                                    {content.start_date && <span>• Từ {new Date(content.start_date).toLocaleDateString('vi-VN')}</span>}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleActive(content)}
                                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${content.is_active
                                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                                            }`}
                                    >
                                        {content.is_active ? '✓ Bật' : '○ Tắt'}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(content)}
                                        className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-bold hover:bg-blue-500/30 transition-colors"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(content.id)}
                                        className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-colors"
                                    >
                                        🗑️
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
