'use client'

import { useState, useEffect } from 'react'

interface ModalContent {
    addPhoneModal: {
        title: string
        subtitle: string
        buttonText: string
        icon: string
        badge: string
    }
    outOfPlaysModal: {
        title: string
        subtitle: string
        buttonText: string
        icon: string
    }
    gameOverModal: {
        title: string
        playAgainButton: string
        shareButton: string
        homeButton: string
        inviteButton: string
        voucherSectionTitle: string
        progressLabels: {
            label50k: string
            label100k: string
            label150k: string
        }
    }
}

const DEFAULT_CONTENT: ModalContent = {
    addPhoneModal: {
        title: '',
        subtitle: '',
        buttonText: '',
        icon: '',
        badge: '',
    },
    outOfPlaysModal: {
        title: '',
        subtitle: '',
        buttonText: '',
        icon: '',
    },
    gameOverModal: {
        title: '',
        playAgainButton: '',
        shareButton: '',
        homeButton: '',
        inviteButton: '',
        voucherSectionTitle: '',
        progressLabels: {
            label50k: '',
            label100k: '',
            label150k: '',
        },
    },
}

export default function ModalContentPage() {
    const [content, setContent] = useState<ModalContent>(DEFAULT_CONTENT)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        fetchContent()
    }, [])

    const fetchContent = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/admin/modal-content', {
                credentials: 'include'
            })
            if (!res.ok) {
                if (res.status === 401) throw new Error('Chưa đăng nhập admin')
                throw new Error('Không thể tải nội dung')
            }
            const data = await res.json()
            if (data.content) {
                setContent(data.content)
            }
        } catch (err) {
            console.error('Fetch content error:', err)
            setError(err instanceof Error ? err.message : 'Lỗi tải nội dung')
        } finally {
            setLoading(false)
        }
    }

    const saveContent = async () => {
        setSaving(true)
        setError('')
        setSuccess('')
        try {
            const res = await fetch('/api/admin/modal-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content })
            })
            if (!res.ok) {
                if (res.status === 401) throw new Error('Chưa đăng nhập admin')
                throw new Error('Không thể lưu nội dung')
            }
            setSuccess('Modal content đã được lưu thành công!')
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            console.error('Save content error:', err)
            setError(err instanceof Error ? err.message : 'Lỗi lưu nội dung')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="text-white">Đang tải...</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">💬 Nội dung Modal</h1>
                <p className="text-gray-400">Quản lý nội dung các modal trong game</p>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg">
                    {success}
                </div>
            )}

            {/* Add Phone Modal */}
            <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">📱 Add Phone Modal</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Title</label>
                            <input
                                type="text"
                                value={content.addPhoneModal.title}
                                onChange={(e) => setContent({ ...content, addPhoneModal: { ...content.addPhoneModal, title: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Button Text</label>
                            <input
                                type="text"
                                value={content.addPhoneModal.buttonText}
                                onChange={(e) => setContent({ ...content, addPhoneModal: { ...content.addPhoneModal, buttonText: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Icon (emoji)</label>
                            <input
                                type="text"
                                value={content.addPhoneModal.icon}
                                onChange={(e) => setContent({ ...content, addPhoneModal: { ...content.addPhoneModal, icon: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Badge</label>
                            <input
                                type="text"
                                value={content.addPhoneModal.badge}
                                onChange={(e) => setContent({ ...content, addPhoneModal: { ...content.addPhoneModal, badge: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Subtitle</label>
                        <textarea
                            value={content.addPhoneModal.subtitle}
                            onChange={(e) => setContent({ ...content, addPhoneModal: { ...content.addPhoneModal, subtitle: e.target.value } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={2}
                        />
                    </div>
                </div>
            </div>

            {/* Out of Plays Modal */}
            <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">😢 Out of Plays Modal</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Title</label>
                            <input
                                type="text"
                                value={content.outOfPlaysModal.title}
                                onChange={(e) => setContent({ ...content, outOfPlaysModal: { ...content.outOfPlaysModal, title: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Button Text</label>
                            <input
                                type="text"
                                value={content.outOfPlaysModal.buttonText}
                                onChange={(e) => setContent({ ...content, outOfPlaysModal: { ...content.outOfPlaysModal, buttonText: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Icon (emoji)</label>
                            <input
                                type="text"
                                value={content.outOfPlaysModal.icon}
                                onChange={(e) => setContent({ ...content, outOfPlaysModal: { ...content.outOfPlaysModal, icon: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Subtitle</label>
                        <textarea
                            value={content.outOfPlaysModal.subtitle}
                            onChange={(e) => setContent({ ...content, outOfPlaysModal: { ...content.outOfPlaysModal, subtitle: e.target.value } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={2}
                        />
                    </div>
                </div>
            </div>

            {/* Game Over Modal */}
            <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">🎮 Game Over Modal</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Play Again Button</label>
                            <input
                                type="text"
                                value={content.gameOverModal.playAgainButton}
                                onChange={(e) => setContent({ ...content, gameOverModal: { ...content.gameOverModal, playAgainButton: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Home Button</label>
                            <input
                                type="text"
                                value={content.gameOverModal.homeButton}
                                onChange={(e) => setContent({ ...content, gameOverModal: { ...content.gameOverModal, homeButton: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Invite Button</label>
                            <input
                                type="text"
                                value={content.gameOverModal.inviteButton}
                                onChange={(e) => setContent({ ...content, gameOverModal: { ...content.gameOverModal, inviteButton: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Share Button</label>
                            <input
                                type="text"
                                value={content.gameOverModal.shareButton}
                                onChange={(e) => setContent({ ...content, gameOverModal: { ...content.gameOverModal, shareButton: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Voucher Section Title</label>
                            <input
                                type="text"
                                value={content.gameOverModal.voucherSectionTitle}
                                onChange={(e) => setContent({ ...content, gameOverModal: { ...content.gameOverModal, voucherSectionTitle: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Progress Labels</label>
                        <div className="grid grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="50K Label"
                                value={content.gameOverModal.progressLabels.label50k}
                                onChange={(e) => setContent({ ...content, gameOverModal: { ...content.gameOverModal, progressLabels: { ...content.gameOverModal.progressLabels, label50k: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <input
                                type="text"
                                placeholder="100K Label"
                                value={content.gameOverModal.progressLabels.label100k}
                                onChange={(e) => setContent({ ...content, gameOverModal: { ...content.gameOverModal, progressLabels: { ...content.gameOverModal.progressLabels, label100k: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <input
                                type="text"
                                placeholder="150K Label"
                                value={content.gameOverModal.progressLabels.label150k}
                                onChange={(e) => setContent({ ...content, gameOverModal: { ...content.gameOverModal, progressLabels: { ...content.gameOverModal.progressLabels, label150k: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={saveContent}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'Đang lưu...' : '💾 Lưu cấu hình'}
                </button>
            </div>
        </div>
    )
}
