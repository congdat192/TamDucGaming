'use client'

import { useAdminConfig } from '@/lib/admin/useAdminConfig'

export default function ModalContentPage() {
    const { config, setConfig, loading, saving, error, success, saveConfig } = useAdminConfig()

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
                                value={config.modalContent.addPhoneModal.title}
                                onChange={(e) => setConfig({ ...config, modalContent: { ...config.modalContent, addPhoneModal: { ...config.modalContent.addPhoneModal, title: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Button Text</label>
                            <input
                                type="text"
                                value={config.modalContent.addPhoneModal.buttonText}
                                onChange={(e) => setConfig({ ...config, modalContent: { ...config.modalContent, addPhoneModal: { ...config.modalContent.addPhoneModal, buttonText: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Icon (emoji)</label>
                            <input
                                type="text"
                                value={config.modalContent.addPhoneModal.icon}
                                onChange={(e) => setConfig({ ...config, modalContent: { ...config.modalContent, addPhoneModal: { ...config.modalContent.addPhoneModal, icon: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Badge</label>
                            <input
                                type="text"
                                value={config.modalContent.addPhoneModal.badge}
                                onChange={(e) => setConfig({ ...config, modalContent: { ...config.modalContent, addPhoneModal: { ...config.modalContent.addPhoneModal, badge: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Subtitle</label>
                        <textarea
                            value={config.modalContent.addPhoneModal.subtitle}
                            onChange={(e) => setConfig({ ...config, modalContent: { ...config.modalContent, addPhoneModal: { ...config.modalContent.addPhoneModal, subtitle: e.target.value } } })}
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
                                value={config.modalContent.outOfPlaysModal.title}
                                onChange={(e) => setConfig({ ...config, modalContent: { ...config.modalContent, outOfPlaysModal: { ...config.modalContent.outOfPlaysModal, title: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Button Text</label>
                            <input
                                type="text"
                                value={config.modalContent.outOfPlaysModal.buttonText}
                                onChange={(e) => setConfig({ ...config, modalContent: { ...config.modalContent, outOfPlaysModal: { ...config.modalContent.outOfPlaysModal, buttonText: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Icon (emoji)</label>
                            <input
                                type="text"
                                value={config.modalContent.outOfPlaysModal.icon}
                                onChange={(e) => setConfig({ ...config, modalContent: { ...config.modalContent, outOfPlaysModal: { ...config.modalContent.outOfPlaysModal, icon: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Subtitle</label>
                        <textarea
                            value={config.modalContent.outOfPlaysModal.subtitle}
                            onChange={(e) => setConfig({ ...config, modalContent: { ...config.modalContent, outOfPlaysModal: { ...config.modalContent.outOfPlaysModal, subtitle: e.target.value } } })}
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
                                value={config.modalContent.gameOverModal.playAgainButton}
                                onChange={(e) => setConfig({ ...config, modalContent: { ...config.modalContent, gameOverModal: { ...config.modalContent.gameOverModal, playAgainButton: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Home Button</label>
                            <input
                                type="text"
                                value={config.modalContent.gameOverModal.homeButton}
                                onChange={(e) => setConfig({ ...config, modalContent: { ...config.modalContent, gameOverModal: { ...config.modalContent.gameOverModal, homeButton: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Invite Button</label>
                            <input
                                type="text"
                                value={config.modalContent.gameOverModal.inviteButton}
                                onChange={(e) => setConfig({ ...config, modalContent: { ...config.modalContent, gameOverModal: { ...config.modalContent.gameOverModal, inviteButton: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Share Button</label>
                            <input
                                type="text"
                                value={config.modalContent.gameOverModal.shareButton}
                                onChange={(e) => setConfig({ ...config, modalContent: { ...config.modalContent, gameOverModal: { ...config.modalContent.gameOverModal, shareButton: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Voucher Section Title</label>
                            <input
                                type="text"
                                value={config.modalContent.gameOverModal.voucherSectionTitle}
                                onChange={(e) => setConfig({ ...config, modalContent: { ...config.modalContent, gameOverModal: { ...config.modalContent.gameOverModal, voucherSectionTitle: e.target.value } } })}
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
                                value={config.modalContent.gameOverModal.progressLabels.label50k}
                                onChange={(e) => setConfig({ ...config, modalContent: { ...config.modalContent, gameOverModal: { ...config.modalContent.gameOverModal, progressLabels: { ...config.modalContent.gameOverModal.progressLabels, label50k: e.target.value } } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <input
                                type="text"
                                placeholder="100K Label"
                                value={config.modalContent.gameOverModal.progressLabels.label100k}
                                onChange={(e) => setConfig({ ...config, modalContent: { ...config.modalContent, gameOverModal: { ...config.modalContent.gameOverModal, progressLabels: { ...config.modalContent.gameOverModal.progressLabels, label100k: e.target.value } } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <input
                                type="text"
                                placeholder="150K Label"
                                value={config.modalContent.gameOverModal.progressLabels.label150k}
                                onChange={(e) => setConfig({ ...config, modalContent: { ...config.modalContent, gameOverModal: { ...config.modalContent.gameOverModal, progressLabels: { ...config.modalContent.gameOverModal.progressLabels, label150k: e.target.value } } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => saveConfig(config)}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'Đang lưu...' : '💾 Lưu cấu hình'}
                </button>
            </div>
        </div>
    )
}
