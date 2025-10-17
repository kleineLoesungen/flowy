/**
 * Utility functions for workday calculations
 * Workdays are considered Monday through Friday (excluding weekends)
 */

/**
 * Add a specified number of workdays to a given date
 * @param startDate - The starting date
 * @param workdaysToAdd - Number of workdays to add
 * @returns New date after adding workdays
 */
export function addWorkdays(startDate: Date, workdaysToAdd: number): Date {
    if (workdaysToAdd <= 0) {
        return new Date(startDate)
    }
    
    const result = new Date(startDate)
    let daysAdded = 0
    
    while (daysAdded < workdaysToAdd) {
        result.setDate(result.getDate() + 1)
        const dayOfWeek = result.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        
        // If it's a weekday (Monday = 1 to Friday = 5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            daysAdded++
        }
    }
    
    return result
}

/**
 * Calculate the number of workdays between two dates
 * @param startDate - The starting date
 * @param endDate - The ending date
 * @returns Number of workdays between the dates
 */
export function getWorkdaysBetween(startDate: Date, endDate: Date): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start >= end) {
        return 0
    }
    
    let workdays = 0
    const current = new Date(start)
    
    while (current < end) {
        const dayOfWeek = current.getDay()
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            workdays++
        }
        current.setDate(current.getDate() + 1)
    }
    
    return workdays
}

/**
 * Check if a given date is a workday (Monday-Friday)
 * @param date - The date to check
 * @returns True if the date is a workday
 */
export function isWorkday(date: Date): boolean {
    const dayOfWeek = date.getDay()
    return dayOfWeek >= 1 && dayOfWeek <= 5
}

/**
 * Get the next workday after a given date
 * @param date - The starting date
 * @returns The next workday
 */
export function getNextWorkday(date: Date): Date {
    return addWorkdays(date, 1)
}

/**
 * Get the previous workday before a given date
 * @param date - The starting date
 * @returns The previous workday
 */
export function getPreviousWorkday(date: Date): Date {
    const result = new Date(date)
    
    do {
        result.setDate(result.getDate() - 1)
    } while (!isWorkday(result))
    
    return result
}