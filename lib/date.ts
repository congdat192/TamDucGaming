
export const TIMEZONE = 'Asia/Ho_Chi_Minh'

// Get current date in YYYY-MM-DD format (Vietnam Time)
export function getVietnamDate(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}

// Get current ISO string but adjusted to preserve Vietnam time value (for comparisons if needed)
// Or simply use this to get the start of the day in Vietnam, converted to UTC
export function getVietnamStartOfDay(dateString?: string): string {
    const date = dateString ? new Date(dateString) : new Date()
    // Create a date object that represents 00:00:00 in Vietnam
    const vnDate = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }))
    vnDate.setHours(0, 0, 0, 0)
    return vnDate.toISOString()
}

// Format a UTC date string to Vietnam display format
export function formatVietnamDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('vi-VN', {
        timeZone: TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

// Format a UTC date string to Vietnam display format with time
export function formatVietnamDateTime(isoString: string): string {
    return new Date(isoString).toLocaleString('vi-VN', {
        timeZone: TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Convert YYYY-MM-DD (Vietnam) to UTC ISO string for start of day (00:00:00 VN)
export function toVietnamStartOfDayUTC(dateString: string): string {
    // Create date at 00:00:00 in Vietnam Time
    // We append T00:00:00+07:00 to force it to be interpreted as VN time
    return new Date(`${dateString}T00:00:00+07:00`).toISOString()
}

// Convert YYYY-MM-DD (Vietnam) to UTC ISO string for end of day (23:59:59.999 VN)
export function toVietnamEndOfDayUTC(dateString: string): string {
    return new Date(`${dateString}T23:59:59.999+07:00`).toISOString()
}
