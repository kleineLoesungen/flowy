import { notifyOverdueElements, areNotificationsEnabled } from '../utils/notifications'
import { useFlowRepository, useTeamRepository, useUserRepository } from '../storage/StorageFactory'
import type { Flow, FlowElement } from '../db/schema'

/**
 * Check for overdue elements and send notifications
 */
async function checkOverdueElements(): Promise<void> {
  if (!areNotificationsEnabled()) {
    return // Skip if notifications are disabled
  }
  
  try {
    const flowRepo = useFlowRepository()
    const teamRepo = useTeamRepository()
    const userRepo = useUserRepository()
    
    // Get all active (non-completed) flows
    const allFlows = await flowRepo.findAll()
    const activeFlows = allFlows.filter((flow: Flow) => !flow.completedAt)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to start of day for comparison
    
    // Collect overdue elements per user
    const userOverdueMap = new Map<string, Array<{ flowId: string; flowName: string; element: FlowElement }>>()
    
    for (const flow of activeFlows) {
      for (const element of flow.elements) {
        // Skip if element is already completed or aborted
        if (element.status === 'completed' || element.status === 'aborted') {
          continue
        }
        
        // Skip if no owner team
        if (!element.ownerTeamId) {
          continue
        }
        
        // Check if element has an expected end date
        if (element.expectedEndedAt) {
          const expectedDate = new Date(element.expectedEndedAt)
          expectedDate.setHours(0, 0, 0, 0)
          
          // If expected date is today or in the past, collect it
          if (expectedDate <= today) {
            // Get team members
            const team = await teamRepo.findById(element.ownerTeamId)
            if (team && team.userIds) {
              for (const userId of team.userIds) {
                const user = await userRepo.findById(userId)
                if (user?.email) {
                  if (!userOverdueMap.has(user.email)) {
                    userOverdueMap.set(user.email, [])
                  }
                  userOverdueMap.get(user.email)!.push({
                    flowId: flow.id,
                    flowName: flow.name,
                    element
                  })
                }
              }
            }
          }
        }
      }
    }
    
    // Send one consolidated email per user
    for (const [email, overdueItems] of userOverdueMap.entries()) {
      await notifyOverdueElements(overdueItems, [email])
    }
    
    console.log(`✅ Overdue element check completed (${userOverdueMap.size} user(s) notified)`)
  } catch (error: any) {
    console.error('❌ Error checking overdue elements:', error.message)
  }
}

/**
 * Nitro plugin to schedule daily overdue checks
 */
export default defineNitroPlugin((nitroApp) => {
  if (!areNotificationsEnabled()) {
    console.log('ℹ️  Overdue scheduler disabled (notifications not configured)')
    return
  }
  
  console.log('📅 Starting daily overdue element scheduler')
  
  // Run check immediately on startup
  checkOverdueElements()
  
  // Schedule to run daily at 9:00 AM
  const scheduleNextCheck = () => {
    const now = new Date()
    const next = new Date()
    next.setHours(9, 0, 0, 0) // 9:00 AM
    
    // If it's already past 9 AM today, schedule for tomorrow
    if (now >= next) {
      next.setDate(next.getDate() + 1)
    }
    
    const timeUntilNext = next.getTime() - now.getTime()
    
    setTimeout(() => {
      checkOverdueElements()
      scheduleNextCheck() // Schedule the next check
    }, timeUntilNext)
    
    console.log(`📅 Next overdue check scheduled for ${next.toLocaleString()}`)
  }
  
  scheduleNextCheck()
})
