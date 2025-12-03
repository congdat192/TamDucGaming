'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { AdContent } from '@/types/ads'

export default function LeaderboardSponsorConfigPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [placementId, setPlacementId] = useState<string>('')

    // 4 logo slots
    const [logos, setLogos] = useState<Array<{
        id?: string
        sponsor_name: string
        logo_url: string
        uploading: boolean
    }>>([
        { sponsor_name: '', logo_url: '', uploading: false },
        { sponsor_name: '', logo_url: '', uploading: false },
        { sponsor_name: '', logo_url: '', uploading: false },
        { sponsor_name: '', logo_url: '', uploading: false },
    ])

    useEffect(() => {
        fetchLeaderboardConfig()
    }, [])

    const fetchLeaderboardConfig = async () => {
        try {
            // Get leaderboard placement
            const placementsRes = await fetch('/api/ads/placements')
            const placementsData = await placementsRes.json()
            const leaderboardPlacement = placementsData.placements?.find(
                (p: any) => p.placement_key === 'leaderboard'
            )

            if (leaderboardPlacement) {
                setPlacementId(leaderboardPlacement.id)

                // Get existing contents
                const contentsRes = await fetch(`/api/ads/contents?placement_id=${leaderboardPlacement.id}`)
                const contentsData = await contentsRes.json()
                const contents = contentsData.contents || []

                // Fill slots with existing data
                const newLogos = [...logos]
                contents.slice(0, 4).forEach((content: AdContent, index: number) => {
                    newLogos[index] = {
                        id: content.id,
                        sponsor_name: content.sponsor_name,
                        logo_url: content.logo_url,
                        uploading: false
                    }
                })
                setLogos(newLogos)
            }
        } catch (error) {
            console.error('Failed to fetch config:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (index: number, file: File) => {
        const newLogos = [...logos]
        newLogos[index].uploading = true
        setLogos(newLogos)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/ads/upload-logo', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            if (data.success) {
                // Update logo URL immediately for preview
                const updatedLogos = [...logos]
                updatedLogos[index].logo_url = data.url
                updatedLogos[index].uploading = false
                setLogos(updatedLogos)

                // Show success message
                alert('✅ Upload thành công! Preview đã cập nhật.')
            } else {
                alert(data.error || 'Upload thất bại')
                newLogos[index].uploading = false
                setLogos(newLogos)
            }
        } catch (error) {
            console.error('Upload error:', error)
            alert('Upload thất bại')
            newLogos[index].uploading = false
            setLogos(newLogos)
        }
    }

    const handleSave = async () => {
        if (!placementId) {
            alert('Không tìm thấy placement ID')
            return
        }

        setSaving(true)
        try {
            // Delete all existing contents first
            const contentsRes = await fetch(`/api/ads/contents?placement_id=${placementId}`)
            const contentsData = await contentsRes.json()
            const existingContents = contentsData.contents || []

            for (const content of existingContents) {
                await fetch(`/api/ads/contents?id=${content.id}`, {
                    method: 'DELETE'
                })
            }

            // Add new contents
            for (let i = 0; i < logos.length; i++) {
                const logo = logos[i]
                if (logo.sponsor_name && logo.logo_url) {
                    await fetch('/api/ads/contents', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            placement_id: placementId,
                            sponsor_name: logo.sponsor_name,
                            logo_url: logo.logo_url,
                            display_order: i,
                            is_active: true
                        })
                    })
                }
            }

            alert('✅ Lưu thành công!')
            fetchLeaderboardConfig()
        } catch (error) {
            console.error('Save error:', error)
            alert('❌ Lưu thất bại')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
            <div className="max-w-5xl mx-auto">
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
                            🏆 Cấu hình Leaderboard Sponsor
                        </h1>
                        <p className="text-white/60">Thiết lập 4 logos nhà tài trợ hiển thị trên bảng xếp hạng</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-white/60">Đang tải...</div>
                    </div>
                ) : (
                    <>
                        {/* Preview */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
                            <h3 className="text-white font-bold mb-4">👁️ Preview (như trên Leaderboard)</h3>
                            <div className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-yellow-500/10 rounded-2xl p-3 border border-yellow-500/20">
                                <div className="text-center mb-2">
                                    <p className="text-yellow-400 text-xs font-bold">✨ Tài trợ bởi ✨</p>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    {logos.map((logo, index) => (
                                        <div
                                            key={index}
                                            className="relative h-20 bg-white rounded-xl p-3 shadow-lg border-2 border-transparent"
                                        >
                                            {logo.logo_url ? (
                                                <Image
                                                    src={logo.logo_url}
                                                    alt={logo.sponsor_name || `Logo ${index + 1}`}
                                                    fill
                                                    className="object-contain p-2"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                                                    Chưa có logo
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Configuration Form */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                            <h3 className="text-white font-bold mb-6">⚙️ Cấu hình 4 Logos</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {logos.map((logo, index) => (
                                    <div
                                        key={index}
                                        className="bg-white/5 rounded-xl p-4 border border-white/10"
                                    >
                                        <h4 className="text-white font-semibold mb-3">
                                            Logo {index + 1}
                                        </h4>

                                        {/* Sponsor Name */}
                                        <div className="mb-3">
                                            <label className="block text-white/80 text-sm mb-2">
                                                Tên nhà tài trợ
                                            </label>
                                            <input
                                                type="text"
                                                value={logo.sponsor_name}
                                                onChange={(e) => {
                                                    const newLogos = [...logos]
                                                    newLogos[index].sponsor_name = e.target.value
                                                    setLogos(newLogos)
                                                }}
                                                placeholder={`VD: ${index === 0 ? 'CHEMI' : index === 1 ? 'Mắt Kính Tâm Đức' : index === 2 ? 'Kodak Lens' : 'New Balance'}`}
                                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                                            />
                                        </div>

                                        {/* Logo Upload */}
                                        <div>
                                            <label className="block text-white/80 text-sm mb-2">
                                                Upload logo
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) handleFileUpload(index, file)
                                                }}
                                                disabled={logo.uploading}
                                                className="text-white/80 text-sm w-full"
                                            />
                                            {logo.uploading && (
                                                <p className="text-yellow-400 text-xs mt-2">Đang upload...</p>
                                            )}
                                            {logo.logo_url && !logo.uploading && (
                                                <div className="mt-3">
                                                    <div className="relative w-full h-24 bg-white rounded-lg overflow-hidden">
                                                        <Image
                                                            src={logo.logo_url}
                                                            alt="Preview"
                                                            fill
                                                            className="object-contain p-2"
                                                            unoptimized
                                                        />
                                                    </div>
                                                    {/* Delete button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newLogos = [...logos]
                                                            newLogos[index].logo_url = ''
                                                            setLogos(newLogos)
                                                        }}
                                                        className="mt-2 w-full px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors"
                                                    >
                                                        🗑️ Xóa logo
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Save Button */}
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => router.push('/admin/ads')}
                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-bold disabled:opacity-50"
                                >
                                    {saving ? 'Đang lưu...' : '💾 Lưu cấu hình'}
                                </button>
                            </div>
                        </div>

                        {/* Help */}
                        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">💡</div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Hướng dẫn</h4>
                                    <ul className="text-white/70 text-sm space-y-1">
                                        <li>• Điền tên và upload logo cho tối đa 4 nhà tài trợ</li>
                                        <li>• Logos sẽ hiển thị theo thứ tự từ trái sang phải (Logo 1 → Logo 4)</li>
                                        <li>• Kích thước đề xuất: 200x200px, nền trong suốt (PNG)</li>
                                        <li>• Click "Lưu cấu hình" để áp dụng thay đổi</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
