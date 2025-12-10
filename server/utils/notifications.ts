import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { FlowElement } from '../db/schema'

interface NotificationConfig {
  enabled: boolean
  smtp: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
  from: string
}

let transporter: Transporter | null = null
let config: NotificationConfig | null = null

/**
 * Initialize email notification system
 * Only enabled if all required environment variables are set
 */
function initializeNotifications(): NotificationConfig | null {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM
  
  if (!host || !port || !user || !pass || !from) {
    console.log('ℹ️  Email notifications disabled (missing SMTP configuration)')
    return null
  }
  
  return {
    enabled: true,
    smtp: {
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465, // true for 465, false for other ports
      auth: {
        user,
        pass
      }
    },
    from
  }
}

/**
 * Get or create email transporter
 */
function getTransporter(): Transporter | null {
  if (!config) {
    config = initializeNotifications()
    if (!config) return null
  }
  
  if (!transporter && config.enabled) {
    transporter = nodemailer.createTransport(config.smtp)
  }
  
  return transporter
}

/**
 * Send email notification to a list of recipients
 */
async function sendEmail(to: string[], subject: string, html: string, excludeEmail?: string): Promise<void> {
  const transport = getTransporter()
  if (!transport || !config) {
    console.log('ℹ️  Email notification skipped (notifications disabled)')
    return
  }
  
  // Filter out the excluded email
  const recipients = excludeEmail 
    ? to.filter(email => email.toLowerCase() !== excludeEmail.toLowerCase())
    : to
  
  if (recipients.length === 0) {
    console.log('ℹ️  Email notification skipped (no recipients after filtering)')
    return
  }
  
  try {
    console.log(`📧 Sending email to: ${recipients.join(', ')}`)
    const info = await transport.sendMail({
      from: config.from,
      to: recipients.join(', '),
      subject,
      html
    })
    console.log(`✅ Email sent to ${recipients.length} recipient(s): ${subject}`)
    console.log(`   Message ID: ${info.messageId}`)
    console.log(`   Response: ${info.response}`)
  } catch (error: any) {
    console.error('❌ Failed to send email:', error.message)
    console.error('   Full error:', error)
  }
}

/**
 * Get user emails from team IDs
 */
async function getUserEmailsFromTeams(teamIds: string[]): Promise<string[]> {
  if (!teamIds.length) return []
  
  const { useTeamRepository, useUserRepository } = await import('../storage/StorageFactory')
  const teamRepo = useTeamRepository()
  const userRepo = useUserRepository()
  
  const emails: string[] = []
  
  for (const teamId of teamIds) {
    const team = await teamRepo.findById(teamId)
    if (team && team.userIds) {
      for (const userId of team.userIds) {
        const user = await userRepo.findById(userId)
        if (user?.email) {
          emails.push(user.email)
        }
      }
    }
  }
  
  return [...new Set(emails)] // Remove duplicates
}

/**
 * Get base URL from environment or default
 */
function getBaseUrl(): string {
  return process.env.BASE_URL || process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

/**
 * Notify when element status changes
 */
export async function notifyStatusChange(
  flowId: string,
  flowName: string,
  element: FlowElement,
  oldStatus: string,
  newStatus: string,
  excludeEmail?: string
): Promise<void> {
  const teamIds = [element.ownerTeamId, ...element.consultedTeamIds].filter(Boolean) as string[]
  const emails = await getUserEmailsFromTeams(teamIds)
  
  if (!emails.length) return
  
  const baseUrl = getBaseUrl()
  const flowUrl = `${baseUrl}/flows/${flowId}/work`
  const elementUrl = `${baseUrl}/flows/${flowId}/work/elements/${element.id}`
  
  const subject = `Status Changed: ${element.name} in ${flowName}`
  const html = `
    <h2>Element Status Updated</h2>
    <p><strong>Flow:</strong> <a href="${flowUrl}">${flowName}</a></p>
    <p><strong>Element:</strong> <a href="${elementUrl}">${element.name}</a></p>
    <p><strong>Type:</strong> ${element.type}</p>
    <p><strong>Status changed:</strong> ${oldStatus} → ${newStatus}</p>
    ${element.description ? `<p><strong>Description:</strong> ${element.description}</p>` : ''}
    <p style="margin-top: 20px;">
      <a href="${elementUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">View Element</a>
    </p>
  `
  
  await sendEmail(emails, subject, html, excludeEmail)
}

/**
 * Notify when comment is added to element
 */
export async function notifyCommentAdded(
  flowId: string,
  flowName: string,
  element: FlowElement,
  comment: {
    userName?: string
    userEmail?: string
    comment: string
    timestamp: string
  },
  excludeEmail?: string
): Promise<void> {
  if (!element.ownerTeamId) return
  
  const emails = await getUserEmailsFromTeams([element.ownerTeamId])
  
  if (!emails.length) return
  
  const baseUrl = getBaseUrl()
  const flowUrl = `${baseUrl}/flows/${flowId}/work`
  const elementUrl = `${baseUrl}/flows/${flowId}/work/elements/${element.id}`
  
  const subject = `New Comment: ${element.name} in ${flowName}`
  const html = `
    <h2>New Comment Added</h2>
    <p><strong>Flow:</strong> <a href="${flowUrl}">${flowName}</a></p>
    <p><strong>Element:</strong> <a href="${elementUrl}">${element.name}</a></p>
    <p><strong>Commented by:</strong> ${comment.userName || comment.userEmail || 'Unknown'}</p>
    <p><strong>Time:</strong> ${new Date(comment.timestamp).toLocaleString()}</p>
    <p><strong>Comment:</strong></p>
    <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin: 10px 0;">
      ${comment.comment}
    </blockquote>
    <p style="margin-top: 20px;">
      <a href="${elementUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">View Element</a>
    </p>
  `
  
  await sendEmail(emails, subject, html, excludeEmail)
}

/**
 * Notify when expected end date is reached for non-completed/non-aborted element
 */
export async function notifyOverdueElement(
  flowId: string,
  flowName: string,
  element: FlowElement
): Promise<void> {
  if (!element.ownerTeamId) return
  if (element.status === 'completed' || element.status === 'aborted') return
  
  const emails = await getUserEmailsFromTeams([element.ownerTeamId])
  
  if (!emails.length) return
  
  const baseUrl = getBaseUrl()
  const flowUrl = `${baseUrl}/flows/${flowId}/work`
  const elementUrl = `${baseUrl}/flows/${flowId}/work/elements/${element.id}`
  
  const subject = `⚠️ Overdue: ${element.name} in ${flowName}`
  const html = `
    <h2>Element Overdue</h2>
    <p><strong>Flow:</strong> <a href="${flowUrl}">${flowName}</a></p>
    <p><strong>Element:</strong> <a href="${elementUrl}">${element.name}</a></p>
    <p><strong>Type:</strong> ${element.type}</p>
    <p><strong>Status:</strong> ${element.status}</p>
    <p><strong>Expected End Date:</strong> ${element.expectedEndedAt ? new Date(element.expectedEndedAt).toLocaleDateString() : 'Not set'}</p>
    ${element.description ? `<p><strong>Description:</strong> ${element.description}</p>` : ''}
    <p style="color: #d9534f; font-weight: bold;">⚠️ This element is past its expected completion date.</p>
    <p style="margin-top: 20px;">
      <a href="${elementUrl}" style="display: inline-block; padding: 10px 20px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px;">View Element</a>
    </p>
  `
  
  await sendEmail(emails, subject, html)
}

/**
 * Send consolidated overdue notification with multiple elements to specific users
 */
export async function notifyOverdueElements(
  overdueItems: Array<{
    flowId: string
    flowName: string
    element: FlowElement
  }>,
  userEmails: string[]
): Promise<void> {
  if (!userEmails.length || !overdueItems.length) return
  
  const baseUrl = getBaseUrl()
  const count = overdueItems.length
  
  const subject = `⚠️ ${count} Overdue Element${count > 1 ? 's' : ''}`
  
  // Build list of overdue elements
  const elementsList = overdueItems.map(({ flowId, flowName, element }) => {
    const elementUrl = `${baseUrl}/flows/${flowId}/work/elements/${element.id}`
    const expectedDate = element.expectedEndedAt ? new Date(element.expectedEndedAt).toLocaleDateString() : 'Not set'
    
    return `
      <div style="border-left: 3px solid #f44336; padding-left: 15px; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>Element:</strong> <a href="${elementUrl}">${element.name}</a></p>
        <p style="margin: 5px 0;"><strong>Flow:</strong> ${flowName}</p>
        <p style="margin: 5px 0;"><strong>Type:</strong> ${element.type}</p>
        <p style="margin: 5px 0;"><strong>Status:</strong> ${element.status}</p>
        <p style="margin: 5px 0;"><strong>Expected End Date:</strong> ${expectedDate}</p>
        ${element.description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${element.description}</p>` : ''}
      </div>
    `
  }).join('')
  
  const html = `
    <h2>You have ${count} overdue element${count > 1 ? 's' : ''}</h2>
    <p style="color: #d9534f; font-weight: bold;">⚠️ The following elements are past their expected completion dates:</p>
    ${elementsList}
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      This is a daily reminder sent at 9:00 AM for all overdue elements assigned to your teams.
    </p>
  `
  
  await sendEmail(userEmails, subject, html)
}

/**
 * Notify all users when a new flow is created
 */
export async function notifyFlowCreated(
  flowId: string,
  flowName: string,
  description: string | null,
  creatorEmail?: string
): Promise<void> {
  const { useUserRepository } = await import('../storage/StorageFactory')
  const userRepo = useUserRepository()
  
  // Get all users
  const allUsers = await userRepo.findAll()
  const userEmails = allUsers
    .filter(u => u.email)
    .map(u => u.email!)
  
  if (!userEmails.length) return
  
  const baseUrl = getBaseUrl()
  const flowUrl = `${baseUrl}/flows/${flowId}/work`
  
  const subject = `📢 New Flow Created: ${flowName}`
  const html = `
    <h2>New Flow Created</h2>
    <p><strong>Flow:</strong> <a href="${flowUrl}">${flowName}</a></p>
    ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
    <p style="margin-top: 20px;">
      <a href="${flowUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">View Flow</a>
    </p>
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      A new flow has been created and is now available.
    </p>
  `
  
  await sendEmail(userEmails, subject, html, creatorEmail)
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled(): boolean {
  if (!config) {
    config = initializeNotifications()
  }
  return config?.enabled ?? false
}

