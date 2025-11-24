import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, getConfiguredProviders } from '@/lib/emailService'

export async function GET(request: NextRequest) {
  // Only allow in development or with secret key
  const { searchParams } = new URL(request.url)
  const testEmail = searchParams.get('email')
  const forceProvider = searchParams.get('provider') // 'gmail' or 'resend'

  if (!testEmail) {
    return NextResponse.json({
      error: 'Missing email parameter. Use ?email=your@email.com',
      configuredProviders: getConfiguredProviders()
    }, { status: 400 })
  }

  // Check configured providers
  const providers = getConfiguredProviders()

  // Test email
  try {
    // Temporarily disable Resend if testing Gmail specifically
    let result
    if (forceProvider === 'gmail') {
      // Test Gmail directly
      const nodemailer = await import('nodemailer')

      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        return NextResponse.json({
          success: false,
          error: 'Gmail not configured',
          providers
        }, { status: 400 })
      }

      const transporter = nodemailer.default.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      })

      const info = await transporter.sendMail({
        from: `Santa Jump Test <${process.env.GMAIL_USER}>`,
        to: testEmail,
        subject: '🎄 Test Gmail SMTP - Santa Jump',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #1a4d2e, #2d5a3d); color: white; border-radius: 10px;">
            <h1>✅ Gmail SMTP hoạt động!</h1>
            <p>Email này được gửi từ Gmail SMTP fallback.</p>
            <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            <p><strong>Từ:</strong> ${process.env.GMAIL_USER}</p>
          </div>
        `
      })

      result = {
        success: true,
        provider: 'gmail',
        messageId: info.messageId
      }
    } else {
      // Use normal flow (Resend first, then Gmail fallback)
      result = await sendEmail({
        to: testEmail,
        subject: '🎄 Test Email Service - Santa Jump',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #1a4d2e, #2d5a3d); color: white; border-radius: 10px;">
            <h1>✅ Email Service hoạt động!</h1>
            <p>Email này được gửi từ hệ thống email với fallback.</p>
            <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
          </div>
        `,
        emailType: 'test'
      })
    }

    return NextResponse.json({
      success: result.success,
      provider: result.provider,
      messageId: result.messageId,
      configuredProviders: providers,
      sentTo: testEmail
    })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      configuredProviders: providers
    }, { status: 500 })
  }
}
