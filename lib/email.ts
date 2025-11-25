import { sendEmail, replaceTemplateVariables } from './emailService'
import { getEmailTemplates } from './emailTemplates'

// Re-export for backwards compatibility
export { replaceTemplateVariables } from './emailService'

export async function sendReferralBonusEmail(email: string, bonusPlays: number, refereeEmail: string) {
  try {
    // Fetch email templates from separate table
    const templates = await getEmailTemplates()
    const emailTemplate = templates.referralBonus

    // Prepare template variables
    const variables = {
      bonusPlays: bonusPlays,
      refereeEmail: refereeEmail,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://game.matkinhtamduc.com',
    }

    // Replace variables in subject and HTML
    const subject = replaceTemplateVariables(emailTemplate.subject, variables)
    const html = replaceTemplateVariables(emailTemplate.htmlTemplate, variables)

    const result = await sendEmail({
      to: email,
      subject,
      html,
      from: emailTemplate.fromEmail,
      fromName: emailTemplate.fromName,
      emailType: 'referral_bonus',
      metadata: { variables }
    })

    return result.success
  } catch (error) {
    console.error('Exception sending referral email:', error)
    return false
  }
}

/**
 * Send OTP email
 */
export async function sendOtpEmail(email: string, otp: string) {
  try {
    const templates = await getEmailTemplates()
    const emailTemplate = templates.otpLogin

    const variables = { otp }
    const subject = replaceTemplateVariables(emailTemplate.subject, variables)
    const html = replaceTemplateVariables(emailTemplate.htmlTemplate, variables)

    const result = await sendEmail({
      to: email,
      subject,
      html,
      from: emailTemplate.fromEmail,
      fromName: emailTemplate.fromName,
      emailType: 'otp',
      metadata: { variables }
    })

    return result.success
  } catch (error) {
    console.error('Exception sending OTP email:', error)
    return false
  }
}

/**
 * Send referral completion email (when referred user reaches threshold)
 */
export async function sendReferralCompletionEmail(
  email: string,
  bonusPlays: number,
  referredEmail: string
) {
  try {
    const templates = await getEmailTemplates()
    const emailTemplate = templates.referralCompletion

    const variables = {
      bonusPlays,
      referredEmail,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://game.matkinhtamduc.com',
    }

    const subject = replaceTemplateVariables(emailTemplate.subject, variables)
    const html = replaceTemplateVariables(emailTemplate.htmlTemplate, variables)

    const result = await sendEmail({
      to: email,
      subject,
      html,
      from: emailTemplate.fromEmail,
      fromName: emailTemplate.fromName,
      emailType: 'referral_completion',
      metadata: { variables }
    })

    return result.success
  } catch (error) {
    console.error('Exception sending referral completion email:', error)
    return false
  }
}

/**
 * Send voucher claim email
 */
export async function sendVoucherEmail(
  email: string,
  voucherLabel: string,
  voucherCode: string,
  expiresAt: string
) {
  try {
    const templates = await getEmailTemplates()
    const emailTemplate = templates.voucherClaim

    const variables = {
      voucherLabel,
      voucherCode,
      expiresAt,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://game.matkinhtamduc.com',
    }

    const subject = replaceTemplateVariables(emailTemplate.subject, variables)
    const html = replaceTemplateVariables(emailTemplate.htmlTemplate, variables)

    const result = await sendEmail({
      to: email,
      subject,
      html,
      from: emailTemplate.fromEmail,
      fromName: emailTemplate.fromName,
      emailType: 'voucher_claim',
      metadata: { variables }
    })

    return result.success
  } catch (error) {
    console.error('Exception sending voucher email:', error)
    return false
  }
}
