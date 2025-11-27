/**
 * VIHAT SMS/ZNS Service
 * Gửi OTP qua MultiChannelMessage API
 * Tự động: ZNS trước → nếu thất bại fallback SMS
 * Sử dụng VIHAT API (eSMS)
 */

interface VihatResponse {
  CodeResult: string
  ErrorMessage?: string
  SMSID?: string
}

interface SendOtpResult {
  success: boolean
  message: string
  smsId?: string
  error?: string
  channel?: 'zns' | 'sms' | 'multi' | 'failed'
}

// ZNS Template ID cho OTP (đã được duyệt trên eSMS)
const ZNS_OTP_TEMPLATE_ID = process.env.VIHAT_ZNS_TEMPLATE_ID || '478665'
// Zalo OA ID
const ZALO_OAID = process.env.VIHAT_ZALO_OAID || '939629380721919913'

/**
 * Gửi OTP qua MultiChannelMessage API
 * API tự động: ZNS (Zalo) trước → nếu thất bại fallback SMS
 * @param phone - Số điện thoại đã format (84xxx)
 * @param otpCode - Mã OTP 6 số
 * @param minuteExpiry - Thời gian hết hạn (phút)
 * @param recordId - ID record trong otp_login_vihat (optional, for callback)
 */
export async function sendVihatOTP(
  phone: string,
  otpCode: string,
  minuteExpiry: number = 5,
  recordId?: string
): Promise<SendOtpResult> {
  const apiKey = process.env.VIHAT_API_KEY
  const secretKey = process.env.VIHAT_SECRET_KEY
  const brandname = process.env.VIHAT_BRANDNAME || 'MKTAMDUC'

  if (!apiKey || !secretKey) {
    console.error('[VIHAT] Missing API credentials')
    return {
      success: false,
      message: 'Cấu hình OTP chưa đầy đủ',
      error: 'Missing VIHAT_API_KEY or VIHAT_SECRET_KEY',
      channel: 'failed'
    }
  }

  // SMS content for fallback
  const smsContent = `${brandname} - Ma xac thuc cua ban la ${otpCode}. Tuyet doi KHONG chia se ma xac thuc cho bat ky ai duoi bat ky hinh thuc nao. Ma xac thuc co hieu luc trong ${minuteExpiry} phut.`

  // MultiChannelMessage payload - ZNS trước, SMS fallback
  const payload = {
    ApiKey: apiKey,
    SecretKey: secretKey,
    Phone: phone,
    Channels: ['zalo', 'sms'], // Ưu tiên Zalo, fallback SMS
    Data: [
      // ZNS config
      {
        TempID: ZNS_OTP_TEMPLATE_ID,
        Params: [otpCode, String(minuteExpiry)],
        OAID: ZALO_OAID,
        campaignid: 'OTP Game MKTD',
        RequestId: recordId || '',
        Sandbox: '0',
        SendingMode: '1' // 1 = gửi ngay
      },
      // SMS config (fallback)
      {
        Content: smsContent,
        IsUnicode: '0',
        SmsType: '2', // OTP SMS
        Brandname: brandname,
        RequestId: recordId || '',
        Sandbox: '0'
      }
    ]
  }

  try {
    console.log(`[VIHAT] Sending OTP via MultiChannel to ${phone.substring(0, 4)}***`)
    console.log(`[VIHAT] Channels: ZNS (primary) → SMS (fallback)`)

    const response = await fetch(
      'https://rest.esms.vn/MainService.svc/json/MultiChannelMessage/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text()
      console.error('[VIHAT] Non-JSON response:', textResponse.substring(0, 200))
      return {
        success: false,
        message: 'Lỗi gửi OTP, vui lòng thử lại',
        error: 'VIHAT returned non-JSON response',
        channel: 'failed'
      }
    }

    const result: VihatResponse = await response.json()
    console.log('[VIHAT] Response:', { CodeResult: result.CodeResult, SMSID: result.SMSID, ErrorMessage: result.ErrorMessage })

    // CodeResult 100 = Success (API accepted, will try ZNS first then SMS)
    if (result.CodeResult === '100') {
      console.log(`[VIHAT] MultiChannel accepted - SMSID: ${result.SMSID}`)
      return {
        success: true,
        message: 'OTP đã được gửi',
        smsId: result.SMSID,
        channel: 'multi' // API sẽ tự chọn ZNS hoặc SMS
      }
    }

    // Error handling
    const errorMessage = getVihatErrorMessage(result.CodeResult, result.ErrorMessage)
    console.error(`[VIHAT] Error: ${result.CodeResult} - ${errorMessage}`)

    return {
      success: false,
      message: errorMessage,
      error: `VIHAT_${result.CodeResult}`,
      channel: 'failed'
    }

  } catch (error) {
    console.error('[VIHAT] Exception:', error)
    return {
      success: false,
      message: 'Không thể gửi OTP, vui lòng thử lại sau',
      error: error instanceof Error ? error.message : 'Unknown error',
      channel: 'failed'
    }
  }
}

/**
 * Map VIHAT error code to user-friendly message
 */
function getVihatErrorMessage(code: string, defaultMessage?: string): string {
  const errorMessages: Record<string, string> = {
    '101': 'Tài khoản chưa được kích hoạt',
    '102': 'Tài khoản bị khóa',
    '103': 'Số dư không đủ',
    '104': 'Brandname không đúng',
    '105': 'Nội dung SMS trống',
    '106': 'Số điện thoại không hợp lệ',
    '107': 'Loại tin nhắn không đúng',
    '108': 'Vượt quá độ dài cho phép',
    '109': 'API không hỗ trợ',
    '110': 'Sai định dạng dữ liệu',
    '111': 'Brandname chưa được duyệt',
    '112': 'Template chưa được duyệt',
    '113': 'Số điện thoại trong blacklist',
    '114': 'Trùng RequestId',
    '115': 'RequestId trống',
    '116': 'Số điện thoại không đúng định dạng',
    '117': 'Loại SMS không hỗ trợ',
    '118': 'Số điện thoại không trong whitelist',
    '119': 'Số điện thoại không phải VN',
    '120': 'Hệ thống đang bảo trì',
  }

  return errorMessages[code] || defaultMessage || 'Lỗi gửi SMS, vui lòng thử lại'
}

/**
 * Validate Vietnamese phone number
 */
export function isValidVietnamesePhone(phone: string): boolean {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')

  // Check if starts with 0 or 84
  if (cleaned.startsWith('84')) {
    return cleaned.length === 11 || cleaned.length === 12
  }
  if (cleaned.startsWith('0')) {
    return cleaned.length === 10 || cleaned.length === 11
  }

  return false
}

/**
 * Format phone to 84xxx format for VIHAT
 */
export function formatPhoneForVihat(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.startsWith('84')) {
    return cleaned
  }
  if (cleaned.startsWith('0')) {
    return '84' + cleaned.substring(1)
  }

  return '84' + cleaned
}
