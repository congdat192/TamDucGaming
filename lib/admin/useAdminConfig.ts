'use client'

import { useState, useEffect } from 'react'
import type { GameConfig } from '../gameConfig'
import { DEFAULT_CONFIG } from '../gameConfig'

export function useAdminConfig() {
    const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Fetch config on mount
    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        setLoading(true)
        setError('')

        try {
            // Cookie is sent automatically with credentials: 'include'
            const res = await fetch('/api/admin/config', {
                credentials: 'include'
            })

            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error('Chưa đăng nhập admin')
                }
                throw new Error('Không thể tải cấu hình')
            }

            const data = await res.json()
            if (data.config) {
                setConfig(data.config)
            }
        } catch (err) {
            console.error('Config fetch error:', err)
            setError(err instanceof Error ? err.message : 'Lỗi tải cấu hình')
            // Keep using DEFAULT_CONFIG on error
        } finally {
            setLoading(false)
        }
    }

    const saveConfig = async (newConfig: GameConfig) => {
        setSaving(true)
        setError('')
        setSuccess('')

        try {
            // Cookie is sent automatically with credentials: 'include'
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ config: newConfig })
            })

            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error('Chưa đăng nhập admin')
                }
                throw new Error('Không thể lưu cấu hình')
            }

            setConfig(newConfig)
            setSuccess('Cấu hình đã được lưu thành công!')

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            console.error('Config save error:', err)
            setError(err instanceof Error ? err.message : 'Lỗi lưu cấu hình')
        } finally {
            setSaving(false)
        }
    }

    return {
        config,
        setConfig,
        loading,
        saving,
        error,
        success,
        saveConfig,
        refetch: fetchConfig
    }
}
