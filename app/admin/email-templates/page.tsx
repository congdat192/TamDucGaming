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

type TemplateKey = keyof EmailTemplates

const TEMPLATE_INFO: Record<TemplateKey, { name: string; icon: string; variables: string[] }> = {
    otpLogin: {
        name: 'OTP Login',
        icon: '🔐',
        variables: ['{{otp}}']
    },
    referralBonus: {
        name: 'Referral Bonus',
        icon: '🎁',
        variables: ['{{bonusPlays}}', '{{refereeEmail}}', '{{appUrl}}']
    },
    referralCompletion: {
        name: 'Referral Completion',
        icon: '🎉',
        variables: ['{{bonusPlays}}', '{{appUrl}}']
    },
    voucherClaim: {
        name: 'Voucher Claim',
        icon: '🎁',
        variables: ['{{voucherLabel}}', '{{voucherCode}}', '{{expiresAt}}']
    }
}

const DEFAULT_TEMPLATES: EmailTemplates = {
    referralBonus: { subject: '', fromName: '', fromEmail: '', htmlTemplate: '' },
    otpLogin: { subject: '', fromName: '', fromEmail: '', htmlTemplate: '' },
    referralCompletion: { subject: '', fromName: '', fromEmail: '', htmlTemplate: '' },
    voucherClaim: { subject: '', fromName: '', fromEmail: '', htmlTemplate: '' },
}

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplates>(DEFAULT_TEMPLATES)
    const [activeTab, setActiveTab] = useState<TemplateKey>('otpLogin')
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
            setSuccess('✅ Email templates đã được lưu thành công!')
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            console.error('Save templates error:', err)
            setError(err instanceof Error ? err.message : 'Lỗi lưu templates')
        } finally {
            setSaving(false)
        }
    }

    const updateTemplate = (key: TemplateKey, field: keyof EmailTemplate, value: string) => {
        setTemplates({
            ...templates,
            [key]: { ...templates[key], [field]: value }
        })
    }

    const getPreviewHtml = (templateKey: TemplateKey): string => {
        const template = templates[templateKey]
        let html = template.htmlTemplate

        // Replace variables with sample data
        const sampleData: Record<string, string> = {
            '{{otp}}': '123456',
            '{{bonusPlays}}': '2',
            '{{refereeEmail}}': 'friend@example.com',
            '{{appUrl}}': 'http://localhost:3000',
            '{{voucherLabel}}': 'Voucher 100K',
            '{{voucherCode}}': 'MKTD-ABC12345',
            '{{expiresAt}}': '31/12/2025'
        }

        Object.entries(sampleData).forEach(([key, value]) => {
            html = html.replace(new RegExp(key, 'g'), value)
        })

        return html
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-white text-lg">⏳ Đang tải...</div>
            </div>
        )
    }

    const currentTemplate = templates[activeTab]
    const templateInfo = TEMPLATE_INFO[activeTab]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">📧 Email Templates</h1>
                <p className="text-gray-400">Chỉnh sửa và xem trước email templates</p>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
                    ❌ {error}
                </div>
            )}

            {success && (
                <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg">
                    {success}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {(Object.keys(TEMPLATE_INFO) as TemplateKey[]).map((key) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === key
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        {TEMPLATE_INFO[key].icon} {TEMPLATE_INFO[key].name}
                    </button>
                ))}
            </div>

            {/* Main Content - Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Editor */}
                <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-xl font-bold text-white mb-4">
                        {templateInfo.icon} {templateInfo.name}
                    </h2>

                    {/* Subject */}
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm font-medium">Subject</label>
                        <input
                            type="text"
                            value={currentTemplate.subject}
                            onChange={(e) => updateTemplate(activeTab, 'subject', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Email subject..."
                        />
                    </div>

                    {/* From Name & Email */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm font-medium">From Name</label>
                            <input
                                type="text"
                                value={currentTemplate.fromName}
                                onChange={(e) => updateTemplate(activeTab, 'fromName', e.target.value)}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Santa Jump"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm font-medium">From Email</label>
                            <input
                                type="email"
                                value={currentTemplate.fromEmail}
                                onChange={(e) => updateTemplate(activeTab, 'fromEmail', e.target.value)}
                                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="noreply@example.com"
                            />
                        </div>
                    </div>

                    {/* HTML Template */}
                    <div>
                        <label className="block text-gray-300 mb-2 text-sm font-medium">HTML Template</label>
                        <textarea
                            value={currentTemplate.htmlTemplate}
                            onChange={(e) => updateTemplate(activeTab, 'htmlTemplate', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                            rows={20}
                            placeholder="<div>Your HTML here...</div>"
                        />
                        <div className="mt-2 text-xs text-gray-400">
                            <span className="font-medium">Available variables:</span>{' '}
                            {templateInfo.variables.map((v, i) => (
                                <span key={v}>
                                    <code className="bg-gray-700 px-1.5 py-0.5 rounded">{v}</code>
                                    {i < templateInfo.variables.length - 1 && ', '}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Preview */}
                <div className="bg-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">👁️ Live Preview</h2>
                    <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                        {/* Email Header */}
                        <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 text-sm">
                            <div className="text-gray-600">
                                <strong>From:</strong> {currentTemplate.fromName || '(No name)'} &lt;{currentTemplate.fromEmail || 'noreply@example.com'}&gt;
                            </div>
                            <div className="text-gray-600 mt-1">
                                <strong>Subject:</strong> {currentTemplate.subject || '(No subject)'}
                            </div>
                        </div>
                        {/* Email Body */}
                        <div
                            className="p-4 overflow-auto max-h-[600px]"
                            dangerouslySetInnerHTML={{ __html: getPreviewHtml(activeTab) }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                        💡 Preview uses sample data for variables
                    </p>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={fetchTemplates}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 disabled:opacity-50"
                >
                    🔄 Reload
                </button>
                <button
                    onClick={saveTemplates}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? '⏳ Đang lưu...' : '💾 Lưu tất cả'}
                </button>
            </div>
        </div>
    )
}
