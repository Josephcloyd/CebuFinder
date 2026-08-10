import { Resend } from 'resend'

const globalForEmail = global as unknown as { resend: Resend | undefined }

export const getResendClient = (): Resend => {
  if (!globalForEmail.resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('RESEND_API_KEY is not set. Email outreach will run in simulated mode.')
    }
    globalForEmail.resend = new Resend(apiKey || 're_dummy_key')
  }
  return globalForEmail.resend
}

interface SendEmailInput {
  to: string
  subject: string
  bodyText: string
}

interface SendEmailOutput {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Sends a B2B outreach email using the Resend API.
 * Falls back to simulation in development if credentials are empty.
 */
export async function sendOutreachEmail(input: SendEmailInput): Promise<SendEmailOutput> {
  const apiKey = process.env.RESEND_API_KEY
  const senderDomain = process.env.OUTREACH_SENDER_EMAIL ?? 'outreach@getcebudigital.com'

  if (!apiKey) {
    console.log(`[Simulated Email Send] to: ${input.to}, subject: "${input.subject}"`)
    console.log(`[Simulated Email Body]:\n${input.bodyText}`)
    return {
      success: true,
      messageId: `sim_msg_${Math.random().toString(36).substring(2, 11)}`,
    }
  }

  const client = getResendClient()

  try {
    const response = await client.emails.send({
      from: `Cebu Digital Hub <${senderDomain}>`,
      to: [input.to],
      subject: input.subject,
      text: input.bodyText,
      // Custom headers for email compliance
      headers: {
        'List-Unsubscribe': `<mailto:${senderDomain}?subject=unsubscribe>`,
        'Precedence': 'bulk',
      },
    })

    if (response.error) {
      return {
        success: false,
        error: response.error.message,
      }
    }

    return {
      success: true,
      messageId: response.data?.id,
    }
  } catch (err: any) {
    console.error('Resend Send Email API Error:', err.message)
    return {
      success: false,
      error: err.message,
    }
  }
}
