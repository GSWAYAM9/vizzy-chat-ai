import crypto from 'crypto'

/**
 * Generate a secure email verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Generate the email verification URL
 */
export function getVerificationUrl(token: string, baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'): string {
  return `${baseUrl}/auth/verify-email?token=${token}`
}

/**
 * Send verification email (placeholder - implement with your email service)
 * For now, we'll log it and return the URL
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  userName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const verificationUrl = getVerificationUrl(token)
    
    console.log('[v0] Verification email would be sent to:', email)
    console.log('[v0] Verification URL:', verificationUrl)
    console.log('[v0] User name:', userName || 'N/A')
    
    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // For now, just log it
    // Example with Resend:
    // const result = await resend.emails.send({
    //   from: 'noreply@vizzy.app',
    //   to: email,
    //   subject: 'Verify your Vizzy Chat AI email',
    //   html: `
    //     <p>Hi ${userName},</p>
    //     <p>Please verify your email by clicking the link below:</p>
    //     <a href="${verificationUrl}">Verify Email</a>
    //     <p>This link expires in 24 hours.</p>
    //   `
    // })
    
    return {
      success: true,
      message: 'Verification email logic implemented. Configure email service in environment variables.',
    }
  } catch (error) {
    console.error('[v0] Error sending verification email:', error)
    return {
      success: false,
      message: 'Failed to send verification email',
    }
  }
}
