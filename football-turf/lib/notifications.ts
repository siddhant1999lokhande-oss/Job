import prisma from '@/lib/db'

export interface NotificationPayload {
  userId: string
  type: string
  title: string
  body: string
  data?: Record<string, string>
}

/**
 * Creates a single notification record in the database.
 */
export async function createNotification(payload: NotificationPayload): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data ? JSON.stringify(payload.data) : null,
    },
  })
}

/**
 * Creates multiple notification records in a single batched operation.
 */
export async function createBulkNotifications(
  payloads: NotificationPayload[]
): Promise<void> {
  if (payloads.length === 0) return

  await prisma.notification.createMany({
    data: payloads.map((p) => ({
      userId: p.userId,
      type: p.type,
      title: p.title,
      body: p.body,
      data: p.data ? JSON.stringify(p.data) : null,
    })),
  })
}

// ─── Notification Factories ────────────────────────────────────────────────────

/**
 * Reminder sent before a match starts.
 * @param hoursUntil Number of hours until the match (e.g. 2 or 24)
 */
export function matchReminderNotification(
  userId: string,
  matchTitle: string,
  matchId: string,
  hoursUntil: number
): NotificationPayload {
  return {
    userId,
    type: 'MATCH_REMINDER',
    title: `Match in ${hoursUntil}h — ${matchTitle}`,
    body: `Your match "${matchTitle}" starts in ${hoursUntil} hour${hoursUntil === 1 ? '' : 's'}. Don't forget to confirm your attendance!`,
    data: { matchId },
  }
}

/**
 * Notification sent when team rosters for a match are published.
 */
export function teamAnnouncedNotification(
  userId: string,
  matchTitle: string,
  matchId: string,
  teamName: string
): NotificationPayload {
  return {
    userId,
    type: 'TEAM_ANNOUNCED',
    title: `Teams announced — ${matchTitle}`,
    body: `You've been placed in ${teamName} for "${matchTitle}". Check the app for your full team lineup.`,
    data: { matchId, teamName },
  }
}

/**
 * Notification sent when a waitlisted player is promoted to the main squad.
 */
export function waitlistPromotedNotification(
  userId: string,
  matchTitle: string,
  matchId: string
): NotificationPayload {
  return {
    userId,
    type: 'WAITLIST_PROMOTED',
    title: `You're in! — ${matchTitle}`,
    body: `A spot opened up and you've been moved from the waitlist to the main squad for "${matchTitle}". Confirm your spot now!`,
    data: { matchId },
  }
}

/**
 * Reminder to complete a pending payment for a match.
 */
export function paymentReminderNotification(
  userId: string,
  matchTitle: string,
  matchId: string,
  amount: number
): NotificationPayload {
  return {
    userId,
    type: 'PAYMENT_REMINDER',
    title: `Payment due — ₹${amount}`,
    body: `You have an outstanding payment of ₹${amount} for "${matchTitle}". Please pay before the match to secure your spot.`,
    data: { matchId, amount: String(amount) },
  }
}

/**
 * Notification sent when a player is assigned as team captain.
 */
export function captainAssignedNotification(
  userId: string,
  matchTitle: string,
  matchId: string,
  teamName: string
): NotificationPayload {
  return {
    userId,
    type: 'CAPTAIN_ASSIGNED',
    title: `You're the captain! — ${teamName}`,
    body: `You've been assigned as captain of ${teamName} for "${matchTitle}". Lead your team to victory!`,
    data: { matchId, teamName },
  }
}

/**
 * Notification sent to all registered players when a match is cancelled.
 */
export function matchCancelledNotification(
  userId: string,
  matchTitle: string,
  reason?: string
): NotificationPayload {
  const body = reason
    ? `"${matchTitle}" has been cancelled. Reason: ${reason}`
    : `"${matchTitle}" has been cancelled. We're sorry for the inconvenience.`

  return {
    userId,
    type: 'MATCH_CANCELLED',
    title: `Match cancelled — ${matchTitle}`,
    body,
    data: reason ? { reason } : undefined,
  }
}
