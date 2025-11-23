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
            const token = localStorage.getItem('admin-token')
            if (!token) {
                throw new Error('Not authenticated')
            }

            const res = await fetch('/api/admin/config', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!res.ok) {
                throw new Error('Failed to fetch config')
            }

            const data = await res.json()
            if (data.config) {
                setConfig(data.config)
            }
        } catch (err) {
            console.error('Config fetch error:', err)
            setError(err instanceof Error ? err.message : 'Failed to load config')
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
            const token = localStorage.getItem('admin-token')
            if (!token) {
                throw new Error('Not authenticated')
            }

            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ config: newConfig })
            })

            if (!res.ok) {
                throw new Error('Failed to save config')
            }

            setConfig(newConfig)
            setSuccess('Cấu hình đã được lưu thành công!')

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            console.error('Config save error:', err)
            setError(err instanceof Error ? err.message : 'Failed to save config')
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
