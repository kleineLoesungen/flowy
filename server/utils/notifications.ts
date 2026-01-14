import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { FlowElement } from '../db/schema'
import { addLog } from './auditLog'
import { useRuntimeConfig } from '#imports'

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
  // Read runtime config via Nuxt's `useRuntimeConfig`.
  const rc = useRuntimeConfig()

  // Accept camelCase runtime config keys and standardized NUXT_ envs
  const host = rc.smtpHost || rc.NUXT_SMTP_HOST || process.env.NUXT_SMTP_HOST || ''
  const port = rc.smtpPort || rc.NUXT_SMTP_PORT || process.env.NUXT_SMTP_PORT || ''
  const user = rc.smtpUser || rc.NUXT_SMTP_USER || process.env.NUXT_SMTP_USER || ''
  const pass = rc.smtpPass || rc.NUXT_SMTP_PASS || process.env.NUXT_SMTP_PASS || ''
  const from = rc.smtpFrom || rc.NUXT_SMTP_FROM || process.env.NUXT_SMTP_FROM || ''

  if (!host || !port || !user || !pass || !from) {
    return null
  }

  return {
    enabled: true,
    smtp: {
      host,
      port: parseInt(String(port)),
      secure: parseInt(String(port)) === 465,
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
async function sendEmail(
  to: string[],
  subject: string,
  html: string,
  excludeEmail?: string,
  meta?: { flowId?: string; elementId?: string; commentId?: string }
): Promise<void> {
  const transport = getTransporter()
  if (!transport || !config) {
    return
  }
  
  // Filter out the excluded email
  const recipients = excludeEmail 
    ? to.filter(email => email.toLowerCase() !== excludeEmail.toLowerCase())
    : to
  
  if (recipients.length === 0) {
    return
  }
  
  try {
    const info = await transport.sendMail({
      from: config.from,
      to: recipients.join(', '),
      subject,
      html
    })
    
    // Record outgoing mail in audit log (use mail_send with optional references)
      try {
      await addLog({
        type: 'mail_sent',
        flowId: meta?.flowId ?? null,
        elementId: meta?.elementId ?? null,
        commentId: meta?.commentId ?? null,
        message: subject,
        details: { recipients, messageId: info.messageId, response: info.response },
        changedBy: null
      })
    } catch (e) {
      // don't fail on logging
      console.error('Failed to write mail log:', e)
    }
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
 * Get all participant team IDs from a flow (all teams assigned to any element)
 */
async function getAllFlowParticipantTeams(flowId: string): Promise<string[]> {
  const { useFlowRepository } = await import('../storage/StorageFactory')
  const flowRepo = useFlowRepository()
  
  const flow = await flowRepo.findById(flowId)
  if (!flow || !flow.elements) return []
  
  const teamIds = new Set<string>()
  
  for (const element of flow.elements) {
    if (element.ownerTeamId) {
      teamIds.add(element.ownerTeamId)
    }
    for (const consultedTeamId of element.consultedTeamIds) {
      teamIds.add(consultedTeamId)
    }
  }
  
  return Array.from(teamIds)
}

/**
 * Get base URL from environment or default
 */
function getBaseUrl(): string {
  const rc = useRuntimeConfig()
  return rc.public?.siteUrl || process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
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
  const flowUrl = `${baseUrl}/flows/${encodeURIComponent(flowId)}/work`
  const elementUrl = `${baseUrl}/flows/${encodeURIComponent(flowId)}/work/elements/${encodeURIComponent(element.id)}`
  
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
  
  await sendEmail(emails, subject, html, excludeEmail, { flowId, elementId: element.id })
}

/**
 * Notify when comment is added to element
 * For artefacts: notifies all flow participants
 * For actions/states: notifies only owner team
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
  let teamIds: string[]
  
  // For artefacts, notify all flow participants
  if (element.type === 'artefact') {
    teamIds = await getAllFlowParticipantTeams(flowId)
  } else {
    // For actions and states, notify only owner team
    if (!element.ownerTeamId) return
    teamIds = [element.ownerTeamId]
  }
  
  const emails = await getUserEmailsFromTeams(teamIds)
  
  if (!emails.length) return
  
  const baseUrl = getBaseUrl()
  const flowUrl = `${baseUrl}/flows/${encodeURIComponent(flowId)}/work`
  const elementUrl = `${baseUrl}/flows/${encodeURIComponent(flowId)}/work/elements/${encodeURIComponent(element.id)}`
  
  const subject = `New Comment: ${element.name} in ${flowName}`
  const html = `
    <h2>New Comment Added</h2>
    <p><strong>Flow:</strong> <a href="${flowUrl}">${flowName}</a></p>
    <p><strong>${element.type === 'artefact' ? 'Artefact' : 'Element'}:</strong> <a href="${elementUrl}">${element.name}</a></p>
    <p><strong>Type:</strong> ${element.type}</p>
    <p><strong>Commented by:</strong> ${comment.userName || comment.userEmail || 'Unknown'}</p>
    <p><strong>Time:</strong> ${new Date(comment.timestamp).toLocaleString()}</p>
    <p><strong>Comment:</strong></p>
    <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin: 10px 0;">
      ${comment.comment}
    </blockquote>
    ${element.type === 'artefact' ? '<p style="color: #2196F3; font-style: italic;">ℹ️ All flow participants are notified when a comment is added to an artefact.</p>' : ''}
    <p style="margin-top: 20px;">
      <a href="${elementUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">${element.type === 'artefact' ? 'View Artefact' : 'View Element'}</a>
    </p>
  `
  
  await sendEmail(emails, subject, html, excludeEmail, { flowId, elementId: element.id, commentId: (comment as any).id })
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
  const flowUrl = `${baseUrl}/flows/${encodeURIComponent(flowId)}/work`
  const elementUrl = `${baseUrl}/flows/${encodeURIComponent(flowId)}/work/elements/${encodeURIComponent(element.id)}`
  
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
  
  await sendEmail(emails, subject, html, undefined, { flowId, elementId: element.id })
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
    const elementUrl = `${baseUrl}/flows/${encodeURIComponent(flowId)}/work/elements/${encodeURIComponent(element.id)}`
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
  const flowUrl = `${baseUrl}/flows/${encodeURIComponent(flowId)}/work`
  
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
  
  await sendEmail(userEmails, subject, html, creatorEmail, { flowId })
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

