'use client'

import { useAdminConfig } from '@/lib/admin/useAdminConfig'

export default function EmailTemplatesPage() {
    const { config, setConfig, loading, saving, error, success, saveConfig } = useAdminConfig()

    if (loading) {
        return <div className="text-white">Đang tải...</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">📧 Email Templates</h1>
                <p className="text-gray-400">Quản lý nội dung email tự động</p>
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

            {/* Referral Bonus Email */}
            <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">📧 Referral Bonus Email</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Subject</label>
                            <input
                                type="text"
                                value={config.emailTemplates.referralBonus.subject}
                                onChange={(e) => setConfig({ ...config, emailTemplates: { ...config.emailTemplates, referralBonus: { ...config.emailTemplates.referralBonus, subject: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <p className="text-gray-500 text-xs mt-1">Variables: {'{{'} bonusPlays {'}}'}</p>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">From Name</label>
                            <input
                                type="text"
                                value={config.emailTemplates.referralBonus.fromName}
                                onChange={(e) => setConfig({ ...config, emailTemplates: { ...config.emailTemplates, referralBonus: { ...config.emailTemplates.referralBonus, fromName: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">From Email</label>
                            <input
                                type="email"
                                value={config.emailTemplates.referralBonus.fromEmail}
                                onChange={(e) => setConfig({ ...config, emailTemplates: { ...config.emailTemplates, referralBonus: { ...config.emailTemplates.referralBonus, fromEmail: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">HTML Template</label>
                        <textarea
                            value={config.emailTemplates.referralBonus.htmlTemplate}
                            onChange={(e) => setConfig({ ...config, emailTemplates: { ...config.emailTemplates, referralBonus: { ...config.emailTemplates.referralBonus, htmlTemplate: e.target.value } } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                            rows={12}
                        />
                        <p className="text-gray-500 text-xs mt-1">Variables: {'{{'} bonusPlays {'}}'}, {'{{'} refereeEmail {'}}'}, {'{{'} appUrl {'}}'}</p>
                    </div>
                </div>
            </div>

            {/* OTP Login Email */}
            <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">🔐 OTP Login Email</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Subject</label>
                            <input
                                type="text"
                                value={config.emailTemplates.otpLogin.subject}
                                onChange={(e) => setConfig({ ...config, emailTemplates: { ...config.emailTemplates, otpLogin: { ...config.emailTemplates.otpLogin, subject: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <p className="text-gray-500 text-xs mt-1">Variables: {'{{'} otp {'}}'}</p>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">From Name</label>
                            <input
                                type="text"
                                value={config.emailTemplates.otpLogin.fromName}
                                onChange={(e) => setConfig({ ...config, emailTemplates: { ...config.emailTemplates, otpLogin: { ...config.emailTemplates.otpLogin, fromName: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">From Email</label>
                            <input
                                type="email"
                                value={config.emailTemplates.otpLogin.fromEmail}
                                onChange={(e) => setConfig({ ...config, emailTemplates: { ...config.emailTemplates, otpLogin: { ...config.emailTemplates.otpLogin, fromEmail: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">HTML Template</label>
                        <textarea
                            value={config.emailTemplates.otpLogin.htmlTemplate}
                            onChange={(e) => setConfig({ ...config, emailTemplates: { ...config.emailTemplates, otpLogin: { ...config.emailTemplates.otpLogin, htmlTemplate: e.target.value } } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                            rows={12}
                        />
                        <p className="text-gray-500 text-xs mt-1">Variables: {'{{'} otp {'}}'}</p>
                    </div>
                </div>
            </div>

            {/* Referral Completion Email */}
            <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">🎉 Referral Completion Email</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Subject</label>
                            <input
                                type="text"
                                value={config.emailTemplates.referralCompletion.subject}
                                onChange={(e) => setConfig({ ...config, emailTemplates: { ...config.emailTemplates, referralCompletion: { ...config.emailTemplates.referralCompletion, subject: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <p className="text-gray-500 text-xs mt-1">Variables: {'{{'} bonusPlays {'}}'}, {'{{'} appUrl {'}}'}</p>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">From Name</label>
                            <input
                                type="text"
                                value={config.emailTemplates.referralCompletion.fromName}
                                onChange={(e) => setConfig({ ...config, emailTemplates: { ...config.emailTemplates, referralCompletion: { ...config.emailTemplates.referralCompletion, fromName: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">From Email</label>
                            <input
                                type="email"
                                value={config.emailTemplates.referralCompletion.fromEmail}
                                onChange={(e) => setConfig({ ...config, emailTemplates: { ...config.emailTemplates, referralCompletion: { ...config.emailTemplates.referralCompletion, fromEmail: e.target.value } } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">HTML Template</label>
                        <textarea
                            value={config.emailTemplates.referralCompletion.htmlTemplate}
                            onChange={(e) => setConfig({ ...config, emailTemplates: { ...config.emailTemplates, referralCompletion: { ...config.emailTemplates.referralCompletion, htmlTemplate: e.target.value } } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                            rows={12}
                        />
                        <p className="text-gray-500 text-xs mt-1">Variables: {'{{'} bonusPlays {'}}'}, {'{{'} appUrl {'}}'}</p>
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
