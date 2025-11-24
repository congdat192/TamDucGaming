import { Resend } from 'resend'
import nodemailer from 'nodemailer'

// Email providers
const resend = new Resend(process.env.RESEND_API_KEY)

// Gmail SMTP transporter (lazy initialized)
let gmailTransporter: nodemailer.Transporter | null = null

function getGmailTransporter() {
  if (!gmailTransporter && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    gmailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    })
  }
  return gmailTransporter
}

// Email options interface
interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  fromName?: string
}

// Result interface
interface SendEmailResult {
  success: boolean
  provider?: 'resend' | 'gmail'
  error?: string
  messageId?: string
}

/**
 * Send email with automatic fallback
 * Priority: Resend -> Gmail SMTP
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, from, fromName } = options
  const toArray = Array.isArray(to) ? to : [to]

  // Default from address
  const defaultFrom = process.env.EMAIL_FROM || 'noreply@example.com'
  const defaultFromName = process.env.EMAIL_FROM_NAME || 'Santa Jump'
  const fromEmail = from || defaultFrom
  const senderName = fromName || defaultFromName

  // Try Resend first
  if (process.env.RESEND_API_KEY) {
    try {
      const { data, error } = await resend.emails.send({
        from: `${senderName} <${fromEmail}>`,
        to: toArray,
        subject,
        html
      })

      if (!error && data) {
        console.log('[EMAIL] Sent via Resend:', data.id)
        return {
          success: true,
          provider: 'resend',
          messageId: data.id
        }
      }

      // Check if it's a rate limit error
      const errorMessage = error?.message || ''
      console.warn('[EMAIL] Resend failed:', errorMessage)

      // If rate limited, try fallback
      if (errorMessage.includes('rate') || errorMessage.includes('limit') || errorMessage.includes('quota')) {
        console.log('[EMAIL] Resend rate limited, trying Gmail fallback...')
      } else {
        // Other errors, still try fallback
        console.log('[EMAIL] Resend error, trying Gmail fallback...')
      }
    } catch (error) {
      console.error('[EMAIL] Resend exception:', error)
    }
  }

  // Fallback to Gmail SMTP
  const gmail = getGmailTransporter()
  if (gmail) {
    try {
      const info = await gmail.sendMail({
        from: `${senderName} <${process.env.GMAIL_USER}>`,
        to: toArray.join(', '),
        subject,
        html
      })

      console.log('[EMAIL] Sent via Gmail:', info.messageId)
      return {
        success: true,
        provider: 'gmail',
        messageId: info.messageId
      }
    } catch (error) {
      console.error('[EMAIL] Gmail failed:', error)
      return {
        success: false,
        error: `Gmail failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // No provider available
  console.error('[EMAIL] No email provider available')
  return {
    success: false,
    error: 'No email provider configured or all providers failed'
  }
}

/**
 * Replace template variables in a string
 * Variables format: {{variableName}}
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string | number>
): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, String(value))
  }
  return result
}

/**
 * Check which email providers are configured
 */
export function getConfiguredProviders(): string[] {
  const providers: string[] = []

  if (process.env.RESEND_API_KEY) {
    providers.push('resend')
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    providers.push('gmail')
  }

  return providers
}
