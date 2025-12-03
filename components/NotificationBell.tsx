'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  data: Record<string, unknown>
  created_at: string
}

interface NotificationBellProps {
  userId?: string
  isLoggedIn: boolean
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export default function NotificationBell({ userId, isLoggedIn }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false) // Track if showing all notifications
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isLoggedIn) return

    try {
      const res = await fetch('/api/notifications/unread-count')
      const data = await res.json()
      setUnreadCount(data.count || 0)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }, [isLoggedIn])

  // Fetch notifications list
  const fetchNotifications = async (limit?: number) => {
    if (!isLoggedIn) return

    setLoading(true)
    try {
      const url = limit ? `/api/notifications?limit=${limit}` : '/api/notifications'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      })

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id)
    }

    // Navigate if there's a link in data
    const link = notification.data?.link as string
    if (link) {
      window.location.href = link
    }
  }

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!isOpen) {
      setShowAll(false) // Reset to show only 3
      fetchNotifications(3) // Fetch only 3 recent notifications
    }
    setIsOpen(!isOpen)
  }

  // Load all notifications
  const handleViewAll = () => {
    setShowAll(true)
    fetchNotifications() // Fetch all notifications (no limit)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Initial fetch & Supabase Realtime subscription
  useEffect(() => {
    if (!isLoggedIn || !userId) return

    fetchUnreadCount()

    // Setup Supabase Realtime subscription
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[REALTIME] New notification:', payload)
          setUnreadCount(prev => prev + 1)

          // Add to list if dropdown is open
          if (isOpen) {
            setNotifications(prev => [payload.new as Notification, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isLoggedIn, userId, fetchUnreadCount, isOpen])

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  // Get icon by type
  const getIcon = (type: string) => {
    switch (type) {
      case 'referral_bonus':
        return '🎁'
      case 'voucher_available':
        return '🎫'
      case 'voucher_expiring':
        return '⏰'
      case 'points_reminder':
        return '💰'
      case 'daily_bonus':
        return '🎮'
      case 'welcome':
        return '👋'
      case 'inactive_reminder':
        return '💤'
      case 'top_ranking':
        return '🏆'
      case 'system':
        return '📢'
      case 'admin_broadcast':
        return '📣'
      default:
        return '🔔'
    }
  }

  if (!isLoggedIn) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-white hover:bg-white/10 rounded-full transition-all"
        aria-label="Thông báo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-gray-900 border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-semibold">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400">
                Đang tải...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <div className="text-4xl mb-2">🔔</div>
                <p>Chưa có thông báo</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-white/5">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 cursor-pointer transition-all hover:bg-white/5 ${!notification.is_read ? 'bg-blue-500/10' : ''
                        }`}
                    >
                      <div className="flex gap-3">
                        <span className="text-xl flex-shrink-0">
                          {getIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${!notification.is_read ? 'text-white font-semibold' : 'text-gray-300'}`}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* View All Button */}
                {!showAll && notifications.length >= 3 && (
                  <div className="border-t border-white/10">
                    <button
                      onClick={handleViewAll}
                      className="w-full px-4 py-3 text-sm text-blue-400 hover:text-blue-300 hover:bg-white/5 transition-all font-medium"
                    >
                      📋 Xem tất cả thông báo
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
