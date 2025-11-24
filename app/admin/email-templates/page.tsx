'use client'

import { useState, useEffect } from 'react'

interface EmailTemplate {
    subject: string
    fromName: string
    fromEmail: string
    htmlTemplate: string
}

interface EmailTemplates {
    referralBonus: EmailTemplate
    otpLogin: EmailTemplate
    referralCompletion: EmailTemplate
    voucherClaim: EmailTemplate
}

const DEFAULT_TEMPLATES: EmailTemplates = {
    referralBonus: {
        subject: '',
        fromName: '',
        fromEmail: '',
        htmlTemplate: '',
    },
    otpLogin: {
        subject: '',
        fromName: '',
        fromEmail: '',
        htmlTemplate: '',
    },
    referralCompletion: {
        subject: '',
        fromName: '',
        fromEmail: '',
        htmlTemplate: '',
    },
    voucherClaim: {
        subject: '',
        fromName: '',
        fromEmail: '',
        htmlTemplate: '',
    },
}

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplates>(DEFAULT_TEMPLATES)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        fetchTemplates()
    }, [])

    const fetchTemplates = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/admin/email-templates', {
                credentials: 'include'
            })
            if (!res.ok) {
                if (res.status === 401) throw new Error('Chưa đăng nhập admin')
                throw new Error('Không thể tải templates')
            }
            const data = await res.json()
            if (data.templates) {
                setTemplates(data.templates)
            }
        } catch (err) {
            console.error('Fetch templates error:', err)
            setError(err instanceof Error ? err.message : 'Lỗi tải templates')
        } finally {
            setLoading(false)
        }
    }

    const saveTemplates = async () => {
        setSaving(true)
        setError('')
        setSuccess('')
        try {
            const res = await fetch('/api/admin/email-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ templates })
            })
            if (!res.ok) {
                if (res.status === 401) throw new Error('Chưa đăng nhập admin')
                throw new Error('Không thể lưu templates')
            }
            setSuccess('Email templates đã được lưu thành công!')
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            console.error('Save templates error:', err)
            setError(err instanceof Error ? err.message : 'Lỗi lưu templates')
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
                                value={templates.referralBonus.subject}
                                onChange={(e) => setTemplates({ ...templates, referralBonus: { ...templates.referralBonus, subject: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <p className="text-gray-500 text-xs mt-1">Variables: {'{{bonusPlays}}'}</p>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">From Name</label>
                            <input
                                type="text"
                                value={templates.referralBonus.fromName}
                                onChange={(e) => setTemplates({ ...templates, referralBonus: { ...templates.referralBonus, fromName: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">From Email</label>
                            <input
                                type="email"
                                value={templates.referralBonus.fromEmail}
                                onChange={(e) => setTemplates({ ...templates, referralBonus: { ...templates.referralBonus, fromEmail: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">HTML Template</label>
                        <textarea
                            value={templates.referralBonus.htmlTemplate}
                            onChange={(e) => setTemplates({ ...templates, referralBonus: { ...templates.referralBonus, htmlTemplate: e.target.value } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                            rows={12}
                        />
                        <p className="text-gray-500 text-xs mt-1">Variables: {'{{bonusPlays}}'}, {'{{refereeEmail}}'}, {'{{appUrl}}'}</p>
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
                                value={templates.otpLogin.subject}
                                onChange={(e) => setTemplates({ ...templates, otpLogin: { ...templates.otpLogin, subject: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <p className="text-gray-500 text-xs mt-1">Variables: {'{{otp}}'}</p>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">From Name</label>
                            <input
                                type="text"
                                value={templates.otpLogin.fromName}
                                onChange={(e) => setTemplates({ ...templates, otpLogin: { ...templates.otpLogin, fromName: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">From Email</label>
                            <input
                                type="email"
                                value={templates.otpLogin.fromEmail}
                                onChange={(e) => setTemplates({ ...templates, otpLogin: { ...templates.otpLogin, fromEmail: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">HTML Template</label>
                        <textarea
                            value={templates.otpLogin.htmlTemplate}
                            onChange={(e) => setTemplates({ ...templates, otpLogin: { ...templates.otpLogin, htmlTemplate: e.target.value } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                            rows={12}
                        />
                        <p className="text-gray-500 text-xs mt-1">Variables: {'{{otp}}'}</p>
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
                                value={templates.referralCompletion.subject}
                                onChange={(e) => setTemplates({ ...templates, referralCompletion: { ...templates.referralCompletion, subject: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <p className="text-gray-500 text-xs mt-1">Variables: {'{{bonusPlays}}'}, {'{{appUrl}}'}</p>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">From Name</label>
                            <input
                                type="text"
                                value={templates.referralCompletion.fromName}
                                onChange={(e) => setTemplates({ ...templates, referralCompletion: { ...templates.referralCompletion, fromName: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">From Email</label>
                            <input
                                type="email"
                                value={templates.referralCompletion.fromEmail}
                                onChange={(e) => setTemplates({ ...templates, referralCompletion: { ...templates.referralCompletion, fromEmail: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">HTML Template</label>
                        <textarea
                            value={templates.referralCompletion.htmlTemplate}
                            onChange={(e) => setTemplates({ ...templates, referralCompletion: { ...templates.referralCompletion, htmlTemplate: e.target.value } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                            rows={12}
                        />
                        <p className="text-gray-500 text-xs mt-1">Variables: {'{{bonusPlays}}'}, {'{{appUrl}}'}</p>
                    </div>
                </div>
            </div>

            {/* Voucher Claim Email */}
            <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">🎁 Voucher Claim Email</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Subject</label>
                            <input
                                type="text"
                                value={templates.voucherClaim?.subject || ''}
                                onChange={(e) => setTemplates({ ...templates, voucherClaim: { ...templates.voucherClaim, subject: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <p className="text-gray-500 text-xs mt-1">Variables: {'{{voucherLabel}}'}</p>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">From Name</label>
                            <input
                                type="text"
                                value={templates.voucherClaim?.fromName || ''}
                                onChange={(e) => setTemplates({ ...templates, voucherClaim: { ...templates.voucherClaim, fromName: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">From Email</label>
                            <input
                                type="email"
                                value={templates.voucherClaim?.fromEmail || ''}
                                onChange={(e) => setTemplates({ ...templates, voucherClaim: { ...templates.voucherClaim, fromEmail: e.target.value } })}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm">HTML Template</label>
                        <textarea
                            value={templates.voucherClaim?.htmlTemplate || ''}
                            onChange={(e) => setTemplates({ ...templates, voucherClaim: { ...templates.voucherClaim, htmlTemplate: e.target.value } })}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                            rows={12}
                        />
                        <p className="text-gray-500 text-xs mt-1">Variables: {'{{voucherLabel}}'}, {'{{voucherCode}}'}, {'{{expiresAt}}'}</p>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={saveTemplates}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'Đang lưu...' : '💾 Lưu cấu hình'}
                </button>
            </div>
        </div>
    )
}
