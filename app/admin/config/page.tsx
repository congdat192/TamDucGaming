'use client'

import { useAdminConfig } from '@/lib/admin/useAdminConfig'

export default function ConfigPage() {
    const { config, setConfig, loading, saving, error, success, saveConfig } = useAdminConfig()

    if (loading) {
        return <div className="text-white">Đang tải...</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">⚙️ Cấu hình Game</h1>
                <p className="text-gray-400">Quản lý cài đặt gameplay và mechanics</p>
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

            {/* Gameplay Settings */}
            <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">🎮 Cài đặt Gameplay</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Số lượt chơi/ngày</label>
                        <input
                            type="number"
                            value={config.maxPlaysPerDay}
                            onChange={(e) => setConfig({ ...config, maxPlaysPerDay: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Bonus plays (thêm SĐT)</label>
                        <input
                            type="number"
                            value={config.bonusPlaysForPhone}
                            onChange={(e) => setConfig({ ...config, bonusPlaysForPhone: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Bonus plays (giới thiệu)</label>
                        <input
                            type="number"
                            value={config.bonusPlaysForReferral}
                            onChange={(e) => setConfig({ ...config, bonusPlaysForReferral: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Game Mechanics */}
            <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">🎮 Cơ chế Game (Vật lý)</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Gravity</label>
                        <input
                            type="number"
                            step="0.1"
                            value={config.gameMechanics.gravity}
                            onChange={(e) => setConfig({ ...config, gameMechanics: { ...config.gameMechanics, gravity: parseFloat(e.target.value) } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Jump Force</label>
                        <input
                            type="number"
                            step="0.5"
                            value={config.gameMechanics.jumpForce}
                            onChange={(e) => setConfig({ ...config, gameMechanics: { ...config.gameMechanics, jumpForce: parseFloat(e.target.value) } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Max Fall Speed</label>
                        <input
                            type="number"
                            step="0.5"
                            value={config.gameMechanics.maxFallSpeed}
                            onChange={(e) => setConfig({ ...config, gameMechanics: { ...config.gameMechanics, maxFallSpeed: parseFloat(e.target.value) } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Obstacle Width</label>
                        <input
                            type="number"
                            value={config.gameMechanics.obstacleWidth}
                            onChange={(e) => setConfig({ ...config, gameMechanics: { ...config.gameMechanics, obstacleWidth: parseInt(e.target.value) } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Gap Height</label>
                        <input
                            type="number"
                            value={config.gameMechanics.gapHeight}
                            onChange={(e) => setConfig({ ...config, gameMechanics: { ...config.gameMechanics, gapHeight: parseInt(e.target.value) } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Obstacle Speed</label>
                        <input
                            type="number"
                            step="0.1"
                            value={config.gameMechanics.obstacleSpeed}
                            onChange={(e) => setConfig({ ...config, gameMechanics: { ...config.gameMechanics, obstacleSpeed: parseFloat(e.target.value) } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Spawn Interval (ms)</label>
                        <input
                            type="number"
                            value={config.gameMechanics.spawnInterval}
                            onChange={(e) => setConfig({ ...config, gameMechanics: { ...config.gameMechanics, spawnInterval: parseInt(e.target.value) } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Speed Increment</label>
                        <input
                            type="number"
                            step="0.01"
                            value={config.gameMechanics.speedIncrement}
                            onChange={(e) => setConfig({ ...config, gameMechanics: { ...config.gameMechanics, speedIncrement: parseFloat(e.target.value) } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Speed Increment Interval (ms)</label>
                        <input
                            type="number"
                            value={config.gameMechanics.speedIncrementInterval}
                            onChange={(e) => setConfig({ ...config, gameMechanics: { ...config.gameMechanics, speedIncrementInterval: parseInt(e.target.value) } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Max Speed</label>
                        <input
                            type="number"
                            step="0.1"
                            value={config.gameMechanics.maxSpeed}
                            onChange={(e) => setConfig({ ...config, gameMechanics: { ...config.gameMechanics, maxSpeed: parseFloat(e.target.value) } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Gap Decrease</label>
                        <input
                            type="number"
                            value={config.gameMechanics.gapDecrease}
                            onChange={(e) => setConfig({ ...config, gameMechanics: { ...config.gameMechanics, gapDecrease: parseInt(e.target.value) } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Min Gap</label>
                        <input
                            type="number"
                            value={config.gameMechanics.minGap}
                            onChange={(e) => setConfig({ ...config, gameMechanics: { ...config.gameMechanics, minGap: parseInt(e.target.value) } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Spawn Interval Decrease (ms)</label>
                        <input
                            type="number"
                            value={config.gameMechanics.spawnIntervalDecrease}
                            onChange={(e) => setConfig({ ...config, gameMechanics: { ...config.gameMechanics, spawnIntervalDecrease: parseInt(e.target.value) } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">Min Spawn Interval (ms)</label>
                        <input
                            type="number"
                            value={config.gameMechanics.minSpawnInterval}
                            onChange={(e) => setConfig({ ...config, gameMechanics: { ...config.gameMechanics, minSpawnInterval: parseInt(e.target.value) } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                </div>
                <p className="text-green-400 text-sm mt-4">✅ Tất cả 14 tham số vật lý game</p>
            </div>

            {/* Voucher Tiers */}
            <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">🎁 Voucher Tiers</h2>
                <div className="space-y-4">
                    {config.voucherTiers.map((tier, index) => (
                        <div key={index} className="bg-gray-700/50 rounded-lg p-4 flex items-center gap-4">
                            <div className="flex-1 grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-gray-300 mb-2 text-sm">Min Score</label>
                                    <input
                                        type="number"
                                        value={tier.minScore}
                                        onChange={(e) => {
                                            const newTiers = [...config.voucherTiers]
                                            newTiers[index] = { ...tier, minScore: parseInt(e.target.value) }
                                            setConfig({ ...config, voucherTiers: newTiers })
                                        }}
                                        className="w-full px-4 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2 text-sm">Value (VND)</label>
                                    <input
                                        type="number"
                                        value={tier.value}
                                        onChange={(e) => {
                                            const newTiers = [...config.voucherTiers]
                                            newTiers[index] = { ...tier, value: parseInt(e.target.value) }
                                            setConfig({ ...config, voucherTiers: newTiers })
                                        }}
                                        className="w-full px-4 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2 text-sm">Label</label>
                                    <input
                                        type="text"
                                        value={tier.label}
                                        onChange={(e) => {
                                            const newTiers = [...config.voucherTiers]
                                            newTiers[index] = { ...tier, label: e.target.value }
                                            setConfig({ ...config, voucherTiers: newTiers })
                                        }}
                                        className="w-full px-4 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const newTiers = config.voucherTiers.filter((_, i) => i !== index)
                                    setConfig({ ...config, voucherTiers: newTiers })
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                                🗑️ Xóa
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => {
                            const newTiers = [...config.voucherTiers, { minScore: 0, value: 0, label: 'New' }]
                            setConfig({ ...config, voucherTiers: newTiers })
                        }}
                        className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        + Thêm Voucher Tier
                    </button>
                </div>
            </div>

            {/* Test Accounts */}
            <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">🧪 Test Accounts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Test Emails */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Test Emails</h3>
                        <div className="space-y-2">
                            {config.testEmails.map((email, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            const newEmails = [...config.testEmails]
                                            newEmails[index] = e.target.value
                                            setConfig({ ...config, testEmails: newEmails })
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                    <button
                                        onClick={() => {
                                            const newEmails = config.testEmails.filter((_, i) => i !== index)
                                            setConfig({ ...config, testEmails: newEmails })
                                        }}
                                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => {
                                    const newEmails = [...config.testEmails, '']
                                    setConfig({ ...config, testEmails: newEmails })
                                }}
                                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                                + Thêm Email
                            </button>
                        </div>
                    </div>

                    {/* Test Phones */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Test Phones</h3>
                        <div className="space-y-2">
                            {config.testPhones.map((phone, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => {
                                            const newPhones = [...config.testPhones]
                                            newPhones[index] = e.target.value
                                            setConfig({ ...config, testPhones: newPhones })
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                    <button
                                        onClick={() => {
                                            const newPhones = config.testPhones.filter((_, i) => i !== index)
                                            setConfig({ ...config, testPhones: newPhones })
                                        }}
                                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => {
                                    const newPhones = [...config.testPhones, '']
                                    setConfig({ ...config, testPhones: newPhones })
                                }}
                                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                                + Thêm Phone
                            </button>
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
