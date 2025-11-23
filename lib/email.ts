import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendReferralBonusEmail(email: string, bonusPlays: number, refereeEmail: string) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Santa Jump <onboarding@resend.dev>',
            to: [email],
            subject: '🎁 Bạn nhận được +5 lượt chơi từ Santa Jump!',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>
            <h1 style="color: #111827; margin: 0 0 8px; font-size: 24px;">Chúc mừng!</h1>
            <p style="color: #4b5563; margin: 0; font-size: 16px;">
              Bạn nhận được <strong>+${bonusPlays} lượt chơi</strong> khi mời thành công <strong style="color: #059669;">${refereeEmail}</strong>
            </p>
          </div>

          <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px; border: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0 0 8px; font-size: 14px;">Tổng cộng bạn nhận được</p>
            <div style="color: #059669; font-size: 32px; font-weight: bold;">+${bonusPlays} lượt chơi</div>
          </div>

          <div style="text-align: center;">
            <a href="https://santa-jump.vercel.app" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Vào chơi ngay 🎮
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px;">
            <p>Mắt Kính Tâm Đức - Santa Jump Game</p>
          </div>
        </div>
      `
        })

        if (error) {
            console.error('Error sending referral email:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('Exception sending referral email:', error)
        return false
    }
}
