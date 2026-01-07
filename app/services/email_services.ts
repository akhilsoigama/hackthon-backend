import env from '#start/env'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

interface EmailLogEntry {
  timestamp: string
  type: 'REAL_EMAIL' | 'MOCK_EMAIL'
  email: string
  password: string
  name: string
  userType: string
  loginUrl: string
  appUrl: string
}

export default class EmailService {
  private appUrl: string
  private brevoApiKey: string | null

  constructor() {
    this.appUrl = env.get('APP_URL') || 'https://eduhub-learn.vercel.app'
    this.brevoApiKey = env.get('BREVO_API_KEY') || null

    if (!this.brevoApiKey) {
      console.log('BREVO_API_KEY missing → using MOCK email mode')
    }
  }

  // 🔥 MAIN METHOD
  async sendCredentialsEmail(
    email: string,
    password: string,
    userType: string,
    name: string
  ): Promise<boolean> {
    if (this.brevoApiKey) {
      try {
        const response = await fetch(
          'https://api.brevo.com/v3/smtp/email',
          {
            method: 'POST',
            headers: {
              'api-key': this.brevoApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sender: {
                email:
                  env.get('SMTP_FROM_ADDRESS') ||
                  'akhilsoigama@gmail.com',
                name: env.get('SMTP_FROM_NAME') || 'EduHub',
              },
              to: [{ email }],
              subject: `EduHub - Your ${userType} Account Credentials`,
              htmlContent: this.getEmailHtml(
                name,
                userType,
                email,
                password
              ),
              textContent: this.getEmailText(
                name,
                userType,
                email,
                password
              ),
            }),
          }
        )

        if (!response.ok) {
          const errorBody = await response.text()
          throw new Error(
            `Brevo API failed: ${response.status} - ${errorBody}`
          )
        }

        console.log('✅ Brevo email sent to:', email)

        await this.logEmailSent(email, password, name, userType, true)
        return true
      } catch (error: any) {
        console.error('❌ Brevo Email API Error:', error.message)
      }
    }

    // 🧪 MOCK FALLBACK
    console.log('📦 Using MOCK email for:', email)
    await this.logEmailSent(email, password, name, userType, false)
    return true
  }

  // 🧾 LOGGING
  private async logEmailSent(
    email: string,
    password: string,
    name: string,
    userType: string,
    realEmail: boolean
  ): Promise<void> {
    const logEntry: EmailLogEntry = {
      timestamp: new Date().toISOString(),
      type: realEmail ? 'REAL_EMAIL' : 'MOCK_EMAIL',
      email,
      password,
      name,
      userType,
      loginUrl: `${this.appUrl}/login`,
      appUrl: this.appUrl,
    }

    const logFile = join(process.cwd(), 'email_logs.json')

    try {
      let logs: EmailLogEntry[] = []

      if (existsSync(logFile)) {
        const content = readFileSync(logFile, 'utf8')
        if (content.trim()) {
          logs = content
            .trim()
            .split('\n')
            .map((line) => JSON.parse(line))
        }
      }

      logs.push(logEntry)

      writeFileSync(
        logFile,
        logs.map((l) => JSON.stringify(l)).join('\n')
      )
    } catch (error) {
      console.error('Failed to log email:', error)
    }
  }

  // ✉️ HTML TEMPLATE
private getEmailHtml(
  name: string,
  userType: string,
  email: string,
  password: string
): string {
  const loginUrl = `${this.appUrl}/login`

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EduHub Account Credentials</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 15px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          
          <!-- HEADER -->
          <tr>
            <td style="background:#4f46e5; padding:24px; text-align:center; color:#ffffff;">
              <h1 style="margin:0; font-size:24px;">🎓 EduHub</h1>
              <p style="margin:8px 0 0; font-size:14px;">
                Your ${userType} account is ready
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:30px; color:#333333;">
              <h2 style="margin-top:0;">Hello ${name},</h2>

              <p style="font-size:15px; line-height:1.6;">
                Welcome to <strong>EduHub</strong>! Your <b>${userType}</b> account has been successfully created.
              </p>

              <!-- CREDENTIAL BOX -->
              <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:20px; margin:20px 0;">
                <h3 style="margin-top:0;">🔐 Login Credentials</h3>

                <p style="margin:8px 0;">
                  <strong>Email:</strong><br />
                  <span style="color:#374151;">${email}</span>
                </p>

                <p style="margin:8px 0;">
                  <strong>Temporary Password:</strong><br />
                  <span style="font-family:monospace; background:#eef2ff; padding:6px 10px; border-radius:4px; display:inline-block;">
                    ${password}
                  </span>
                </p>

                <p style="margin-top:16px;">
                  <a href="${loginUrl}" 
                     style="display:inline-block; background:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:6px; font-weight:bold;">
                    🚀 Login to EduHub
                  </a>
                </p>
              </div>

              <!-- WARNING -->
              <div style="background:#fff7ed; border-left:4px solid #f97316; padding:14px; border-radius:4px;">
                <strong>⚠️ Security Notice</strong>
                <p style="margin:6px 0 0; font-size:14px;">
                  Please change your password immediately after your first login to keep your account secure.
                </p>
              </div>

              <p style="margin-top:24px; font-size:14px;">
                If you need help, feel free to contact our support team.
              </p>

              <p style="margin-top:30px; font-size:14px;">
                Regards,<br />
                <strong>EduHub Team</strong>
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f9fafb; text-align:center; padding:15px; font-size:12px; color:#6b7280;">
              This is an automated email. Please do not reply.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

  private getEmailText(
  name: string,
  userType: string,
  email: string,
  password: string
): string {
  const loginUrl = `${this.appUrl}/login`

  return `
🎓 EDUHUB – ACCOUNT DETAILS

Hello ${name},

Welcome to EduHub!
Your ${userType} account has been created successfully.

────────────────────────
🔐 LOGIN CREDENTIALS
────────────────────────
Email: ${email}
Temporary Password: ${password}

Login here:
${loginUrl}

⚠️ IMPORTANT SECURITY NOTICE
Please change your password immediately after your first login.

If you need any help, contact our support team.

Regards,
EduHub Team

────────────────────────
This is an automated email. Do not reply.
`
}

}
