import { Resend } from 'resend'
import { getEmailTemplates } from './emailTemplates'

const resend = new Resend(process.env.RESEND_API_KEY)

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

export async function sendReferralBonusEmail(email: string, bonusPlays: number, refereeEmail: string) {
  try {
    // Fetch email templates from separate table
    const templates = await getEmailTemplates()
    const emailTemplate = templates.referralBonus

    // Prepare template variables
    const variables = {
      bonusPlays: bonusPlays,
      refereeEmail: refereeEmail,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://santa-jump.vercel.app',
    }

    // Replace variables in subject and HTML
    const subject = replaceTemplateVariables(emailTemplate.subject, variables)
    const html = replaceTemplateVariables(emailTemplate.htmlTemplate, variables)

    const { data, error } = await resend.emails.send({
      from: `${emailTemplate.fromName} <${emailTemplate.fromEmail}>`,
      to: [email],
      subject: subject,
      html: html
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
