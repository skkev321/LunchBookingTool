import { format, addDays, startOfDay, isBefore, parseISO, isWeekend, startOfWeek, endOfWeek } from 'date-fns'

const isWeekday = (date) => !isWeekend(date)

/**
 * Check if a date is available for booking based on cutoff logic
 * Cutoff: 6pm previous day
 * If date is tomorrow, check if current time is before 6pm today
 * Otherwise, date must be within next 7 days
 */
export const isDateAvailableForBooking = (targetDate) => {
  const now = new Date()
  const today = startOfDay(new Date())
  const tomorrow = startOfDay(addDays(today, 1))
  const targetDateStart = startOfDay(parseISO(targetDate))

  // Must be a future weekday
  if (!isWeekday(targetDateStart) || isBefore(targetDateStart, tomorrow)) {
    return false
  }

  // Check cutoff: 6pm cutoff for next day
  if (targetDateStart.getTime() === tomorrow.getTime()) {
    // For tomorrow, check if current time is before 6pm today
    const cutoffTime = new Date(today)
    cutoffTime.setHours(18, 0, 0, 0) // 6pm
    return isBefore(now, cutoffTime)
  }

  // For other weekdays, cutoff was the day before at 6pm
  const dayBeforeCutoff = addDays(targetDateStart, -1)
  dayBeforeCutoff.setHours(18, 0, 0, 0)
  
  // If that day before hasn't passed yet, date is available
  // Otherwise, cutoff has passed
  return isBefore(now, dayBeforeCutoff)
}

/**
 * Get available dates for booking (weekdays only, respecting cutoff)
 */
export const getAvailableBookingDates = () => {
  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)
  const nextWeekEnd = addDays(today, 7)
  
  const dates = []
  let current = tomorrow

  while (isBefore(current, nextWeekEnd) || current.getTime() === nextWeekEnd.getTime()) {
    if (isWeekday(current) && isDateAvailableForBooking(format(current, 'yyyy-MM-dd'))) {
      dates.push(format(current, 'yyyy-MM-dd'))
    }
    current = addDays(current, 1)
  }

  return dates
}

/**
 * Get the current week's weekday dates (Mon-Fri)
 */
export const getCurrentWeekDates = () => {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 }) // Friday

  const dates = []
  let current = weekStart

  while (isBefore(current, weekEnd) || current.getTime() === weekEnd.getTime()) {
    dates.push(format(current, 'yyyy-MM-dd'))
    current = addDays(current, 1)
  }

  return dates
}

/**
 * Get next week's weekday dates
 */
export const getNextWeekDates = () => {
  const today = new Date()
  const nextWeekStart = addDays(startOfWeek(today, { weekStartsOn: 1 }), 7)
  const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 1 })

  const dates = []
  let current = nextWeekStart

  while (isBefore(current, nextWeekEnd) || current.getTime() === nextWeekEnd.getTime()) {
    dates.push(format(current, 'yyyy-MM-dd'))
    current = addDays(current, 1)
  }

  return dates
}

/**
 * Format date for display
 */
export const formatDateDisplay = (dateString) => {
  return format(parseISO(dateString), 'EEE, MMM d')
}

/**
 * Format date and time for display
 */
export const formatDateTimeDisplay = (dateString) => {
  return format(parseISO(dateString), 'MMM d, yyyy h:mm a')
}

/**
 * Get protein color for UI
 */
export const getProteinColor = (protein) => {
  const colors = {
    'Chicken': '#FF6B6B',
    'Fish': '#4ECDC4',
    'Egg': '#FFE66D',
    'Veg': '#95E1D3'
  }
  return colors[protein] || '#999'
}

/**
 * Check if cutoff time has passed for a date
 */
export const hasCutoffPassed = (targetDate) => {
  const now = new Date()
  const targetDateObj = parseISO(targetDate)
  const dayBefore = addDays(targetDateObj, -1)
  const cutoffTime = new Date(dayBefore)
  cutoffTime.setHours(18, 0, 0, 0) // 6pm

  return isBefore(cutoffTime, now)
}

/**
 * Get time until cutoff for a date (in readable format)
 */
export const getTimeUntilCutoff = (targetDate) => {
  const now = new Date()
  const targetDateObj = parseISO(targetDate)
  const dayBefore = addDays(targetDateObj, -1)
  const cutoffTime = new Date(dayBefore)
  cutoffTime.setHours(18, 0, 0, 0)

  const diffMs = cutoffTime.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  return `${diffHours}h ${diffMinutes}m`
}

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * Generate a consistent color based on email (for avatars, etc.)
 */
export const getColorFromEmail = (email) => {
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return `hsl(${hue}, 70%, 60%)`
}
