// app/services/email_service.ts
import nodemailer from 'nodemailer'
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
  private transporter: any = null
  private appUrl: string = ''
  
  constructor() {
    this.appUrl = env.get('APP_URL') || 'https://eduhub-learn.vercel.app'
    
    const smtpHost = env.get('SMTP_HOST')
    const smtpUsername = env.get('SMTP_USERNAME')
    let smtpPassword = env.get('SMTP_PASSWORD')

    if (!smtpUsername || !smtpPassword) {
      this.transporter = null
      console.log('SMTP credentials missing, using mock emails')
      return
    }
    
    // Remove spaces from password
    smtpPassword = smtpPassword.replace(/\s+/g, '')
    
    try {
      // Brevo SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: smtpHost || 'smtp-relay.brevo.com', 
        port: 587, 
        secure: false, 
        requireTLS: true,
        auth: {
          user: smtpUsername,
          pass: smtpPassword,
        },
        tls: {
          rejectUnauthorized: true
        },
        connectionTimeout: 10000, 
        socketTimeout: 15000, 
        pool: true,
        maxConnections: 5,
        maxMessages: 100
      })
      
      // Verify connection configuration
      this.transporter.verify((error: any) => {
        if (error) {
          console.error('SMTP Connection Error:', error.message)
          this.transporter = null
        } else {
          console.log('SMTP Connection Verified: Ready to send emails')
        }
      })
      
    } catch (error) {
      console.error('Transporter creation error:', error)
      this.transporter = null
    }
  }

  async sendCredentialsEmail(email: string, password: string, userType: string, name: string): Promise<boolean> {
    
    if (this.transporter) {
      try {
        const fromEmail = env.get('SMTP_FROM_ADDRESS') || env.get('SMTP_USERNAME') || 'eduhub@example.com'
        const fromName = env.get('SMTP_FROM_NAME') || 'EduHub'
        
        const mailOptions = {
          from: `"${fromName}" <${fromEmail}>`,
          to: email,
          subject: `EduHub - Your ${userType} Account Credentials`,
          html: this.getEmailHtml(name, userType, email, password),
          text: this.getEmailText(name, userType, email, password),
          headers: {
            'X-SMTPAPI': JSON.stringify({
              filters: {
                clicktrack: { settings: { enable: 0 } },
                opentrack: { settings: { enable: 0 } }
              }
            })
          }
        }
        
        console.log('Attempting to send email to:', email)
        console.log('From email:', fromEmail)
        
        const info = await this.transporter.sendMail(mailOptions)
        console.log('Email sent successfully:', info.messageId)
        
        await this.logEmailSent(email, password, name, userType, true)
        
        return true
      } catch (error: any) {
        // Better error logging
        console.error('Email sending error:', {
          message: error.message,
          code: error.code,
          command: error.command,
          responseCode: error.responseCode
        })
        
        // Check for specific Brevo errors
        if (error.responseCode === 550) {
          console.error('Brevo Error: Sender email not verified. Please verify in Brevo dashboard.')
        }
        
        // Silently fallback to mock email
      }
    } else {
      console.log('No transporter available, using mock email')
    }
    
    // Fallback to mock email
    await this.logEmailSent(email, password, name, userType, false)
    return true
  }

  private async logEmailSent(email: string, password: string, name: string, userType: string, realEmail: boolean): Promise<void> {
    const logEntry: EmailLogEntry = {
      timestamp: new Date().toISOString(),
      type: realEmail ? 'REAL_EMAIL' : 'MOCK_EMAIL',
      email: email,
      password: password,
      name: name,
      userType: userType,
      loginUrl: `${this.appUrl}/login`,
      appUrl: this.appUrl
    }
    
    const logFile = join(process.cwd(), 'email_logs.json')
    
    try {
      let logs: EmailLogEntry[] = []
      
      if (existsSync(logFile)) {
        const content = readFileSync(logFile, 'utf8')
        if (content.trim()) {
          const lines = content.trim().split('\n')
          logs = lines.map((line: string) => JSON.parse(line))
        }
      }
      
      logs.push(logEntry)
      writeFileSync(logFile, logs.map((log: EmailLogEntry) => JSON.stringify(log)).join('\n'))
      
    } catch (error) {
      console.error('Failed to log email:', error)
    }
  }

  private getEmailHtml(name: string, userType: string, email: string, password: string): string {
    const loginUrl = `${this.appUrl}/login`
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>EduHub - Account Credentials</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f7fa;">
        <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px 20px; text-align: center;">
                <h1 style="margin: 0;">🎓 Welcome to EduHub!</h1>
                <p style="margin: 10px 0 0 0;">Your Education Management Platform</p>
            </div>
            
            <div style="padding: 30px;">
                <h2 style="margin-top: 0;">Hello ${name},</h2>
                <p>Your <strong>${userType}</strong> account has been created successfully!</p>
                
                <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">🔐 Your Login Credentials</h3>
                    <div style="margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                        <span style="font-weight: bold; color: #4b5563; display: inline-block; width: 100px;">Email:</span> ${email}
                    </div>
                    <div style="margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                        <span style="font-weight: bold; color: #4b5563; display: inline-block; width: 100px;">Password:</span> 
                        <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code>
                    </div>
                    <div style="margin: 10px 0; padding: 8px 0;">
                        <span style="font-weight: bold; color: #4b5563; display: inline-block; width: 100px;">Login URL:</span> 
                        <a href="${loginUrl}" style="color: #4f46e5; text-decoration: none;">${loginUrl}</a>
                    </div>
                    
                    <a href="${loginUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0;">🚀 Login to EduHub</a>
                </div>
                
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px 0;">⚠️ Security Notice</h4>
                    <p style="margin: 0;"><strong>Important:</strong> For security, please change your password immediately after first login.</p>
                </div>
                
                <p>Need help? Contact our support team.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                    <p>Best regards,</p>
                    <p><strong>The EduHub Team</strong></p>
                    <p style="font-size: 12px; color: #9ca3af;">
                        This is an automated message. Do not reply to this email.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `
  }

  private getEmailText(name: string, userType: string, email: string, password: string): string {
    const loginUrl = `${this.appUrl}/login`
    
    return `
🎓 Welcome to EduHub!

Hello ${name},

Your ${userType} account has been created successfully!

🔐 YOUR LOGIN CREDENTIALS
────────────────────────────
Email: ${email}
Password: ${password}
Login URL: ${loginUrl}

⚠️ SECURITY NOTICE
────────────────────────────
For your security, please CHANGE YOUR PASSWORD immediately 
after first login.

🚀 QUICK START
────────────────────────────
1. Go to: ${loginUrl}
2. Use the credentials above
3. Change password in account settings

Need help? Contact our support team.

Best regards,
The EduHub Team

────────────────────────────
This is an automated message. Do not reply to this email.
    `
  }
}