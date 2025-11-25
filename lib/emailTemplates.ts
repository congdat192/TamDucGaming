import { supabaseAdmin } from './supabase-admin'

export interface EmailTemplate {
  subject: string
  fromName: string
  fromEmail: string
  htmlTemplate: string
}

export interface EmailTemplates {
  referralBonus: EmailTemplate
  otpLogin: EmailTemplate
  referralCompletion: EmailTemplate
  voucherClaim: EmailTemplate
  giftRedemption: EmailTemplate
}

// Default email templates
const DEFAULT_TEMPLATES: EmailTemplates = {
  referralBonus: {
    subject: '🎁 Bạn nhận được +{{bonusPlays}} lượt chơi từ Santa Jump!',
    fromName: 'Santa Jump',
    fromEmail: 'onboarding@resend.dev',
    htmlTemplate: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>
    <h1 style="color: #111827; margin: 0 0 8px; font-size: 24px;">Chúc mừng!</h1>
    <p style="color: #4b5563; margin: 0; font-size: 16px;">
      Bạn nhận được <strong>+{{bonusPlays}} lượt chơi</strong> khi mời thành công <strong style="color: #059669;">{{refereeEmail}}</strong>
    </p>
  </div>
  <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px; border: 1px solid #e5e7eb;">
    <p style="color: #6b7280; margin: 0 0 8px; font-size: 14px;">Tổng cộng bạn nhận được</p>
    <div style="color: #059669; font-size: 32px; font-weight: bold;">+{{bonusPlays}} lượt chơi</div>
  </div>
  <div style="text-align: center;">
    <a href="{{appUrl}}" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 16px;">
      Vào chơi ngay 🎮
    </a>
  </div>
  <div style="text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px;">
    <p>Mắt Kính Tâm Đức - Santa Jump Game</p>
  </div>
</div>`,
  },
  otpLogin: {
    subject: '🎅 Mã OTP đăng nhập Santa Jump',
    fromName: 'Santa Jump',
    fromEmail: 'gaming@matkinhtamduc.com',
    htmlTemplate: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 30px; border-radius: 15px; text-align: center;">
    <h1 style="color: #FFD700; margin: 0; font-size: 28px;">🎅 SANTA JUMP 🎄</h1>
    <p style="color: #22c55e; margin: 10px 0; font-size: 18px;">Mắt Kính Tâm Đức</p>
  </div>
  <div style="background: #f0f9ff; padding: 30px; border-radius: 15px; margin-top: 20px; text-align: center;">
    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Mã OTP của bạn là:</p>
    <div style="background: #1e3a5f; color: #FFD700; font-size: 36px; font-weight: bold; padding: 20px 40px; border-radius: 10px; letter-spacing: 8px; display: inline-block;">
      {{otp}}
    </div>
    <p style="color: #666; font-size: 14px; margin-top: 20px;">Mã có hiệu lực trong 5 phút</p>
  </div>
  <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
    By Chief Everything Officer
  </p>
</div>`,
  },
  referralCompletion: {
    subject: '🎁 Bạn nhận được lượt chơi mới!',
    fromName: 'Santa Jump',
    fromEmail: 'gaming@matkinhtamduc.com',
    htmlTemplate: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 30px; border-radius: 15px; text-align: center;">
    <h1 style="color: #FFD700; margin: 0; font-size: 28px;">🎅 SANTA JUMP 🎄</h1>
    <p style="color: #22c55e; margin: 10px 0; font-size: 18px;">Mắt Kính Tâm Đức</p>
  </div>
  <div style="background: #f0f9ff; padding: 30px; border-radius: 15px; margin-top: 20px; text-align: center;">
    <h2 style="color: #1e3a5f; margin-top: 0;">Chúc mừng! 🎉</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.5;">
      Bạn bè của bạn đã tham gia trò chơi và hoàn thành lượt chơi đầu tiên.
    </p>
    <div style="background: #22c55e; color: white; font-size: 24px; font-weight: bold; padding: 15px 30px; border-radius: 10px; display: inline-block; margin: 20px 0;">
      +{{bonusPlays}} Lượt Chơi
    </div>
    <p style="color: #666; font-size: 14px;">
      Hãy vào game ngay để sử dụng lượt chơi mới nhé!
    </p>
    <a href="{{appUrl}}" style="display: inline-block; background: #FFD700; color: #000; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 25px; margin-top: 10px;">Chơi Ngay</a>
  </div>
  <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
    By Chief Everything Officer
  </p>
</div>`,
  },
  voucherClaim: {
    subject: '🎁 Voucher {{voucherLabel}} của bạn đã sẵn sàng!',
    fromName: 'Santa Jump',
    fromEmail: 'gaming@matkinhtamduc.com',
    htmlTemplate: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 30px; border-radius: 15px; text-align: center;">
    <h1 style="color: #FFD700; margin: 0; font-size: 28px;">🎅 SANTA JUMP 🎄</h1>
    <p style="color: #22c55e; margin: 10px 0; font-size: 18px;">Mắt Kính Tâm Đức</p>
  </div>
  <div style="background: #f0f9ff; padding: 30px; border-radius: 15px; margin-top: 20px; text-align: center;">
    <h2 style="color: #1e3a5f; margin-top: 0;">Chúc mừng! 🎉</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.5;">
      Bạn đã nhận được voucher <strong>{{voucherLabel}}</strong>
    </p>
    <div style="background: #fff; border: 2px dashed #FFD700; padding: 20px; border-radius: 10px; margin: 20px 0;">
      <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">Mã voucher của bạn:</p>
      <p style="color: #000; font-size: 32px; font-weight: bold; font-family: monospace; margin: 0;">{{voucherCode}}</p>
    </div>
    <p style="color: #666; font-size: 14px;">
      Voucher có giá trị đến {{expiresAt}}
    </p>
    <p style="color: #999; font-size: 12px; margin-top: 20px;">
      Vui lòng xuất trình mã này khi mua hàng tại Mắt Kính Tâm Đức
    </p>
  </div>
</div>`,
  },
  giftRedemption: {
    subject: '🎁 Quà tặng {{giftName}} của bạn đã sẵn sàng!',
    fromName: 'Santa Jump',
    fromEmail: 'gaming@matkinhtamduc.com',
    htmlTemplate: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 30px; border-radius: 15px; text-align: center;">
    <h1 style="color: #FFD700; margin: 0; font-size: 28px;">🎅 SANTA JUMP 🎄</h1>
    <p style="color: #22c55e; margin: 10px 0; font-size: 18px;">Mắt Kính Tâm Đức</p>
  </div>
  <div style="background: #f0f9ff; padding: 30px; border-radius: 15px; margin-top: 20px; text-align: center;">
    <h2 style="color: #1e3a5f; margin-top: 0;">Chúc mừng! 🎉</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.5;">
      Bạn đã đổi thành công quà tặng <strong>{{giftName}}</strong>
    </p>
    <div style="background: #fff; border: 2px dashed #22c55e; padding: 20px; border-radius: 10px; margin: 20px 0;">
      <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">Mã nhận quà của bạn:</p>
      <p style="color: #000; font-size: 32px; font-weight: bold; font-family: monospace; margin: 0;">{{giftCode}}</p>
    </div>
    <p style="color: #666; font-size: 14px;">
      Vui lòng mang mã này đến cửa hàng Mắt Kính Tâm Đức gần nhất để nhận quà.
    </p>
    <p style="color: #999; font-size: 12px; margin-top: 20px;">
      Chúng tôi sẽ sớm liên hệ với bạn để xác nhận.
    </p>
  </div>
</div>`,
  },
}

// Cache for email templates
let cachedTemplates: EmailTemplates | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 60000 // 1 minute cache

export async function getEmailTemplates(): Promise<EmailTemplates> {
  const now = Date.now()

  // Return cached templates if still valid
  if (cachedTemplates && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedTemplates
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .select('templates')
      .eq('id', 'main')
      .single()

    if (error || !data) {
      console.log('Using default email templates (DB error or not found)')
      return DEFAULT_TEMPLATES
    }

    // Merge with defaults to ensure all fields exist
    const templates: EmailTemplates = { ...DEFAULT_TEMPLATES, ...data.templates }
    cachedTemplates = templates
    cacheTimestamp = now

    return templates
  } catch (error) {
    console.error('Error fetching email templates:', error)
    return DEFAULT_TEMPLATES
  }
}

// Clear cache (call after template update)
export function clearEmailTemplatesCache(): void {
  cachedTemplates = null
  cacheTimestamp = 0
}
