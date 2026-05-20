import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isPast, isToday, isTomorrow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns "Today", "Tomorrow", or a formatted date like "Sat, 15 Jun".
 */
export function formatMatchDate(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'EEE, d MMM')
}

/**
 * Converts 24-hour time string to 12-hour AM/PM format.
 * e.g. "18:00" -> "6:00 PM", "09:30" -> "9:30 AM"
 */
export function formatMatchTime(time: string): string {
  const [hourStr, minuteStr] = time.split(':')
  const hour = parseInt(hourStr, 10)
  const minute = minuteStr ?? '00'
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${minute} ${period}`
}

/**
 * Returns a Tailwind CSS color class for a given match status string.
 */
export function getMatchStatusColor(status: string): string {
  const map: Record<string, string> = {
    UPCOMING: 'text-blue-600',
    CONFIRMED: 'text-green-600',
    IN_PROGRESS: 'text-yellow-600',
    COMPLETED: 'text-gray-500',
    CANCELLED: 'text-red-600',
  }
  return map[status] ?? 'text-gray-400'
}

/**
 * Returns a human-readable label for a position code.
 */
export function getPositionLabel(position: string | null): string {
  if (!position) return 'Any'
  const map: Record<string, string> = {
    GK: 'Goalkeeper',
    DEF: 'Defender',
    MID: 'Midfielder',
    FWD: 'Forward',
    ANY: 'Any',
  }
  return map[position] ?? position
}

/**
 * Formats a numeric amount as Indian Rupee currency.
 * e.g. 150 -> "₹150"
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

/**
 * Returns the initials from a full name (up to 2 characters).
 * e.g. "John Doe" -> "JD", "Ravi" -> "R"
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Returns the age in full years from a birth date.
 */
export function calculateAge(date: Date): number {
  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const monthDiff = today.getMonth() - date.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--
  }
  return age
}

/**
 * Converts a string to a URL-friendly slug.
 * e.g. "Sunday Warriors FC" -> "sunday-warriors-fc"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Returns true if the match has reached its maximum player capacity.
 */
export function isMatchFull(currentPlayers: number, maxPlayers: number): boolean {
  return currentPlayers >= maxPlayers
}

/**
 * Returns a human-readable waitlist position string.
 * e.g. 3 -> "#3 on waitlist"
 */
export function getWaitlistPosition(position: number): string {
  return `#${position} on waitlist`
}

/**
 * Returns true if the given date is in the past.
 */
export function isMatchPast(date: Date): boolean {
  return isPast(date)
}
