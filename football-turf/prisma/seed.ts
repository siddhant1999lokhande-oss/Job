import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const rawDbUrl = process.env.DATABASE_URL ?? 'file:./dev.db'
const dbRelPath = rawDbUrl.replace('file:', '')
const dbPath = path.isAbsolute(dbRelPath) ? dbRelPath : path.join(process.cwd(), dbRelPath)
const adapter = new PrismaBetterSqlite3({ url: dbPath })
const prisma = new PrismaClient({ adapter })

async function main() {
  // ─── Venues ──────────────────────────────────────────────────────────────────

  const venue1 = await prisma.venue.upsert({
    where: { id: 'venue-ground-zero' },
    update: {},
    create: {
      id: 'venue-ground-zero',
      name: 'Ground Zero Turf',
      address: '12, Whitefield Main Road, Whitefield',
      city: 'Bengaluru',
      latitude: 12.9698,
      longitude: 77.7499,
      mapLink: 'https://maps.google.com/?q=Ground+Zero+Turf+Whitefield',
      amenities: JSON.stringify(['Changing Rooms', 'Parking', 'Floodlights', 'Drinking Water']),
      photos: JSON.stringify(['/venues/ground-zero-1.jpg', '/venues/ground-zero-2.jpg']),
      isActive: true,
    },
  })

  const venue2 = await prisma.venue.upsert({
    where: { id: 'venue-champions-arena' },
    update: {},
    create: {
      id: 'venue-champions-arena',
      name: 'Champions Arena',
      address: '45, Sarjapur Road, Bellandur',
      city: 'Bengaluru',
      latitude: 12.9279,
      longitude: 77.6771,
      mapLink: 'https://maps.google.com/?q=Champions+Arena+Bellandur',
      amenities: JSON.stringify(['Changing Rooms', 'Cafeteria', 'Parking', 'Floodlights', 'First Aid']),
      photos: JSON.stringify(['/venues/champions-1.jpg', '/venues/champions-2.jpg']),
      isActive: true,
    },
  })

  // ─── Group ───────────────────────────────────────────────────────────────────

  const group = await prisma.group.upsert({
    where: { id: 'group-sunday-warriors' },
    update: {},
    create: {
      id: 'group-sunday-warriors',
      name: 'Sunday Warriors',
      description: 'Weekly Sunday football squad — all skill levels welcome!',
      isPrivate: false,
      inviteCode: 'sunday-warriors-invite',
    },
  })

  // ─── Users ───────────────────────────────────────────────────────────────────

  const adminUser = await prisma.user.upsert({
    where: { phone: '9999999999' },
    update: {},
    create: {
      id: 'user-ravi-kumar',
      name: 'Ravi Kumar',
      phone: '9999999999',
      email: 'ravi@turfmate.app',
      role: 'ADMIN',
      preferredPosition: 'MID',
      preferredFoot: 'RIGHT',
      skillLevel: 8,
      fitnessLevel: 8,
      aggressionLevel: 5,
      versatility: 8,
      gkWillingness: false,
      isActive: true,
    },
  })

  const players = [
    {
      id: 'user-arjun-singh',
      name: 'Arjun Singh',
      phone: '9876543201',
      email: 'arjun@example.com',
      preferredPosition: 'FWD',
      skillLevel: 9,
      fitnessLevel: 9,
      aggressionLevel: 7,
      versatility: 7,
      gkWillingness: false,
    },
    {
      id: 'user-priya-nair',
      name: 'Priya Nair',
      phone: '9876543202',
      email: 'priya@example.com',
      preferredPosition: 'MID',
      skillLevel: 7,
      fitnessLevel: 8,
      aggressionLevel: 4,
      versatility: 8,
      gkWillingness: false,
    },
    {
      id: 'user-suresh-babu',
      name: 'Suresh Babu',
      phone: '9876543203',
      email: 'suresh@example.com',
      preferredPosition: 'GK',
      skillLevel: 8,
      fitnessLevel: 7,
      aggressionLevel: 5,
      versatility: 4,
      gkWillingness: true,
    },
    {
      id: 'user-deepak-mehta',
      name: 'Deepak Mehta',
      phone: '9876543204',
      email: 'deepak@example.com',
      preferredPosition: 'DEF',
      skillLevel: 7,
      fitnessLevel: 8,
      aggressionLevel: 8,
      versatility: 6,
      gkWillingness: false,
    },
    {
      id: 'user-aniket-joshi',
      name: 'Aniket Joshi',
      phone: '9876543205',
      email: 'aniket@example.com',
      preferredPosition: 'FWD',
      skillLevel: 6,
      fitnessLevel: 7,
      aggressionLevel: 6,
      versatility: 5,
      gkWillingness: false,
    },
    {
      id: 'user-karan-patel',
      name: 'Karan Patel',
      phone: '9876543206',
      email: 'karan@example.com',
      preferredPosition: 'MID',
      skillLevel: 6,
      fitnessLevel: 6,
      aggressionLevel: 5,
      versatility: 7,
      gkWillingness: false,
    },
    {
      id: 'user-vivek-sharma',
      name: 'Vivek Sharma',
      phone: '9876543207',
      email: 'vivek@example.com',
      preferredPosition: 'DEF',
      skillLevel: 5,
      fitnessLevel: 6,
      aggressionLevel: 7,
      versatility: 5,
      gkWillingness: false,
    },
    {
      id: 'user-rohan-das',
      name: 'Rohan Das',
      phone: '9876543208',
      email: 'rohan@example.com',
      preferredPosition: 'GK',
      skillLevel: 7,
      fitnessLevel: 7,
      aggressionLevel: 4,
      versatility: 3,
      gkWillingness: true,
    },
    {
      id: 'user-meera-iyer',
      name: 'Meera Iyer',
      phone: '9876543209',
      email: 'meera@example.com',
      preferredPosition: 'MID',
      skillLevel: 6,
      fitnessLevel: 7,
      aggressionLevel: 4,
      versatility: 6,
      gkWillingness: false,
    },
    {
      id: 'user-sahil-khan',
      name: 'Sahil Khan',
      phone: '9876543210',
      email: 'sahil@example.com',
      preferredPosition: 'FWD',
      skillLevel: 8,
      fitnessLevel: 8,
      aggressionLevel: 6,
      versatility: 6,
      gkWillingness: false,
    },
    {
      id: 'user-nikhil-rao',
      name: 'Nikhil Rao',
      phone: '9876543211',
      email: 'nikhil@example.com',
      preferredPosition: 'DEF',
      skillLevel: 5,
      fitnessLevel: 5,
      aggressionLevel: 6,
      versatility: 5,
      gkWillingness: false,
    },
    {
      id: 'user-tanvi-ghosh',
      name: 'Tanvi Ghosh',
      phone: '9876543212',
      email: 'tanvi@example.com',
      preferredPosition: 'MID',
      skillLevel: 4,
      fitnessLevel: 5,
      aggressionLevel: 3,
      versatility: 6,
      gkWillingness: false,
    },
  ]

  const createdPlayers = []
  for (const p of players) {
    const user = await prisma.user.upsert({
      where: { phone: p.phone },
      update: {},
      create: {
        ...p,
        role: 'PLAYER',
        preferredFoot: 'RIGHT',
        isActive: true,
      },
    })
    createdPlayers.push(user)
  }

  const allUsers = [adminUser, ...createdPlayers]

  // ─── Group Memberships ────────────────────────────────────────────────────────

  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: adminUser.id } },
    update: {},
    create: {
      groupId: group.id,
      userId: adminUser.id,
      role: 'OWNER',
    },
  })

  for (const player of createdPlayers) {
    await prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: group.id, userId: player.id } },
      update: {},
      create: {
        groupId: group.id,
        userId: player.id,
        role: 'MEMBER',
      },
    })
  }

  // ─── Badges ───────────────────────────────────────────────────────────────────

  const badgeIronBoot = await prisma.badge.upsert({
    where: { name: 'Iron Boot' },
    update: {},
    create: {
      name: 'Iron Boot',
      description: 'Played 10 or more matches',
      icon: '👟',
      category: 'ATTENDANCE',
      threshold: 10,
    },
  })

  const badgeHatTrick = await prisma.badge.upsert({
    where: { name: 'Hat-Trick Hero' },
    update: {},
    create: {
      name: 'Hat-Trick Hero',
      description: 'Scored a hat-trick in a single match',
      icon: '🎩',
      category: 'PERFORMANCE',
      threshold: 3,
    },
  })

  const badgeCaptain = await prisma.badge.upsert({
    where: { name: 'Captain Reliable' },
    update: {},
    create: {
      name: 'Captain Reliable',
      description: 'Captained a team 5 or more times',
      icon: '🏅',
      category: 'SOCIAL',
      threshold: 5,
    },
  })

  // ─── Matches ──────────────────────────────────────────────────────────────────

  // Next Saturday
  const nextSaturday = new Date()
  nextSaturday.setDate(nextSaturday.getDate() + ((6 - nextSaturday.getDay() + 7) % 7 || 7))
  nextSaturday.setHours(18, 0, 0, 0)

  // Next Sunday
  const nextSunday = new Date(nextSaturday)
  nextSunday.setDate(nextSunday.getDate() + 1)
  nextSunday.setHours(17, 0, 0, 0)

  const match1 = await prisma.match.upsert({
    where: { id: 'match-saturday-warriors' },
    update: {},
    create: {
      id: 'match-saturday-warriors',
      title: 'Saturday Warriors Clash',
      date: nextSaturday,
      startTime: '18:00',
      endTime: '19:30',
      venueId: venue1.id,
      format: '6v6',
      matchType: 'CASUAL',
      skillLevel: 'ALL',
      maxPlayers: 12,
      minPlayers: 8,
      costPerPlayer: 150,
      totalCost: 1800,
      status: 'CONFIRMED',
      jerseyTeamA: '#FF0000',
      jerseyTeamB: '#0000FF',
      turfRules: 'No studs. Respect the referee. No arguing.',
      cancellationRules: 'Cancel at least 2 hours before match to avoid penalty.',
      teamsLocked: true,
      createdById: adminUser.id,
      groupId: group.id,
    },
  })

  const match2 = await prisma.match.upsert({
    where: { id: 'match-sunday-showdown' },
    update: {},
    create: {
      id: 'match-sunday-showdown',
      title: 'Sunday Showdown',
      date: nextSunday,
      startTime: '17:00',
      endTime: '18:30',
      venueId: venue2.id,
      format: '7v7',
      matchType: 'COMPETITIVE',
      skillLevel: 'INTERMEDIATE',
      maxPlayers: 14,
      minPlayers: 10,
      costPerPlayer: 200,
      totalCost: 2800,
      status: 'UPCOMING',
      jerseyTeamA: '#00FF00',
      jerseyTeamB: '#FF6600',
      turfRules: 'Flat-soled shoes only. No slide tackles.',
      cancellationRules: 'Cancel at least 3 hours before match.',
      teamsLocked: false,
      createdById: adminUser.id,
      groupId: group.id,
    },
  })

  // ─── Match 1 Players ──────────────────────────────────────────────────────────

  // Register 10 players for match1: admin + first 9 players
  const match1Players = [adminUser, ...createdPlayers.slice(0, 9)]

  for (const player of match1Players) {
    await prisma.matchPlayer.upsert({
      where: { matchId_userId: { matchId: match1.id, userId: player.id } },
      update: {},
      create: {
        matchId: match1.id,
        userId: player.id,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        paymentStatus: match1Players.indexOf(player) % 3 === 0 ? 'PENDING' : 'PAID',
      },
    })
  }

  // ─── Match 1 Teams ────────────────────────────────────────────────────────────

  const teamA = await prisma.team.upsert({
    where: { id: 'team-match1-red' },
    update: {},
    create: {
      id: 'team-match1-red',
      matchId: match1.id,
      name: 'Red Squad',
      color: '#FF0000',
      score: 0,
      isWinner: false,
    },
  })

  const teamB = await prisma.team.upsert({
    where: { id: 'team-match1-blue' },
    update: {},
    create: {
      id: 'team-match1-blue',
      matchId: match1.id,
      name: 'Blue Squad',
      color: '#0000FF',
      score: 0,
      isWinner: false,
    },
  })

  // Assign 5 players to each team
  const teamAPlayers = match1Players.slice(0, 5)
  const teamBPlayers = match1Players.slice(5, 10)

  for (const player of teamAPlayers) {
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: teamA.id, userId: player.id } },
      update: {},
      create: {
        teamId: teamA.id,
        userId: player.id,
        position: player.preferredPosition ?? undefined,
      },
    })
    // Update MatchPlayer teamId
    await prisma.matchPlayer.updateMany({
      where: { matchId: match1.id, userId: player.id },
      data: { teamId: teamA.id },
    })
  }

  for (const player of teamBPlayers) {
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: teamB.id, userId: player.id } },
      update: {},
      create: {
        teamId: teamB.id,
        userId: player.id,
        position: player.preferredPosition ?? undefined,
      },
    })
    await prisma.matchPlayer.updateMany({
      where: { matchId: match1.id, userId: player.id },
      data: { teamId: teamB.id },
    })
  }

  // ─── Match 1 Captains ─────────────────────────────────────────────────────────

  await prisma.captainAssignment.upsert({
    where: { id: 'captain-match1-teamA' },
    update: {},
    create: {
      id: 'captain-match1-teamA',
      matchId: match1.id,
      teamId: teamA.id,
      userId: adminUser.id,
      assignedBy: adminUser.id,
      isActive: true,
    },
  })

  await prisma.captainAssignment.upsert({
    where: { id: 'captain-match1-teamB' },
    update: {},
    create: {
      id: 'captain-match1-teamB',
      matchId: match1.id,
      teamId: teamB.id,
      userId: createdPlayers[0].id, // Arjun Singh
      assignedBy: adminUser.id,
      isActive: true,
    },
  })

  // ─── Match 2 Players ──────────────────────────────────────────────────────────

  // Register 8 players for match2
  const match2Players = [adminUser, ...createdPlayers.slice(0, 7)]

  for (const player of match2Players) {
    await prisma.matchPlayer.upsert({
      where: { matchId_userId: { matchId: match2.id, userId: player.id } },
      update: {},
      create: {
        matchId: match2.id,
        userId: player.id,
        status: 'REGISTERED',
        paymentStatus: 'PENDING',
      },
    })
  }

  // ─── Payments for Match 1 ────────────────────────────────────────────────────

  for (let i = 0; i < match1Players.length; i++) {
    const player = match1Players[i]
    const isPaid = i % 3 !== 0
    await prisma.payment.upsert({
      where: { id: `payment-match1-${player.id}` },
      update: {},
      create: {
        id: `payment-match1-${player.id}`,
        matchId: match1.id,
        userId: player.id,
        amount: 150,
        status: isPaid ? 'PAID' : 'PENDING',
        method: isPaid ? (i % 2 === 0 ? 'UPI' : 'CASH') : undefined,
        paidAt: isPaid ? new Date() : undefined,
        dueDate: nextSaturday,
        penalty: 0,
      },
    })
  }

  // ─── Reliability Scores ───────────────────────────────────────────────────────

  const reliabilityData = [
    { userId: adminUser.id, score: 95, tier: 'LEGEND', totalMatches: 45, attended: 44, noShows: 0, lateCancels: 1 },
    { userId: createdPlayers[0].id, score: 88, tier: 'PLATINUM', totalMatches: 30, attended: 29, noShows: 0, lateCancels: 1 },
    { userId: createdPlayers[1].id, score: 92, tier: 'PLATINUM', totalMatches: 25, attended: 24, noShows: 0, lateCancels: 0 },
    { userId: createdPlayers[2].id, score: 75, tier: 'GOLD', totalMatches: 20, attended: 18, noShows: 1, lateCancels: 1 },
    { userId: createdPlayers[3].id, score: 80, tier: 'GOLD', totalMatches: 18, attended: 17, noShows: 0, lateCancels: 1 },
    { userId: createdPlayers[4].id, score: 65, tier: 'GOLD', totalMatches: 15, attended: 13, noShows: 1, lateCancels: 1 },
    { userId: createdPlayers[5].id, score: 55, tier: 'SILVER', totalMatches: 12, attended: 10, noShows: 1, lateCancels: 1 },
    { userId: createdPlayers[6].id, score: 70, tier: 'GOLD', totalMatches: 10, attended: 9, noShows: 0, lateCancels: 1 },
    { userId: createdPlayers[7].id, score: 45, tier: 'BRONZE', totalMatches: 8, attended: 6, noShows: 2, lateCancels: 0 },
    { userId: createdPlayers[8].id, score: 75, tier: 'GOLD', totalMatches: 6, attended: 5, noShows: 0, lateCancels: 1 },
    { userId: createdPlayers[9].id, score: 85, tier: 'PLATINUM', totalMatches: 5, attended: 5, noShows: 0, lateCancels: 0 },
    { userId: createdPlayers[10].id, score: 75, tier: 'BRONZE', totalMatches: 2, attended: 1, noShows: 0, lateCancels: 0 },
    { userId: createdPlayers[11].id, score: 75, tier: 'BRONZE', totalMatches: 1, attended: 1, noShows: 0, lateCancels: 0 },
  ]

  for (const rel of reliabilityData) {
    await prisma.reliabilityScore.upsert({
      where: { userId: rel.userId },
      update: {},
      create: rel,
    })
  }

  // ─── Player Stats ─────────────────────────────────────────────────────────────

  const statsData = [
    { userId: adminUser.id, matchesPlayed: 45, matchesOrganised: 20, goals: 12, assists: 18, cleanSheets: 0, mvpCount: 3, captainCount: 15, wins: 26, losses: 12, draws: 7, noShows: 0, lateCancels: 1 },
    { userId: createdPlayers[0].id, matchesPlayed: 30, matchesOrganised: 0, goals: 25, assists: 10, cleanSheets: 0, mvpCount: 5, captainCount: 3, wins: 18, losses: 9, draws: 3, noShows: 0, lateCancels: 1 },
    { userId: createdPlayers[1].id, matchesPlayed: 25, matchesOrganised: 0, goals: 8, assists: 15, cleanSheets: 0, mvpCount: 2, captainCount: 1, wins: 15, losses: 7, draws: 3, noShows: 0, lateCancels: 0 },
    { userId: createdPlayers[2].id, matchesPlayed: 20, matchesOrganised: 0, goals: 0, assists: 2, cleanSheets: 8, mvpCount: 1, captainCount: 0, wins: 11, losses: 7, draws: 2, noShows: 1, lateCancels: 1 },
    { userId: createdPlayers[3].id, matchesPlayed: 18, matchesOrganised: 0, goals: 3, assists: 5, cleanSheets: 0, mvpCount: 0, captainCount: 0, wins: 10, losses: 6, draws: 2, noShows: 0, lateCancels: 1 },
    { userId: createdPlayers[4].id, matchesPlayed: 15, matchesOrganised: 0, goals: 10, assists: 4, cleanSheets: 0, mvpCount: 1, captainCount: 0, wins: 8, losses: 5, draws: 2, noShows: 1, lateCancels: 1 },
    { userId: createdPlayers[5].id, matchesPlayed: 12, matchesOrganised: 0, goals: 5, assists: 6, cleanSheets: 0, mvpCount: 0, captainCount: 0, wins: 6, losses: 5, draws: 1, noShows: 1, lateCancels: 1 },
    { userId: createdPlayers[6].id, matchesPlayed: 10, matchesOrganised: 0, goals: 1, assists: 3, cleanSheets: 0, mvpCount: 0, captainCount: 0, wins: 5, losses: 4, draws: 1, noShows: 0, lateCancels: 1 },
    { userId: createdPlayers[7].id, matchesPlayed: 8, matchesOrganised: 0, goals: 0, assists: 1, cleanSheets: 3, mvpCount: 0, captainCount: 0, wins: 3, losses: 3, draws: 2, noShows: 2, lateCancels: 0 },
    { userId: createdPlayers[8].id, matchesPlayed: 6, matchesOrganised: 0, goals: 3, assists: 2, cleanSheets: 0, mvpCount: 0, captainCount: 0, wins: 4, losses: 2, draws: 0, noShows: 0, lateCancels: 1 },
    { userId: createdPlayers[9].id, matchesPlayed: 5, matchesOrganised: 0, goals: 4, assists: 1, cleanSheets: 0, mvpCount: 1, captainCount: 0, wins: 3, losses: 2, draws: 0, noShows: 0, lateCancels: 0 },
    { userId: createdPlayers[10].id, matchesPlayed: 2, matchesOrganised: 0, goals: 0, assists: 0, cleanSheets: 0, mvpCount: 0, captainCount: 0, wins: 1, losses: 1, draws: 0, noShows: 0, lateCancels: 0 },
    { userId: createdPlayers[11].id, matchesPlayed: 1, matchesOrganised: 0, goals: 0, assists: 0, cleanSheets: 0, mvpCount: 0, captainCount: 0, wins: 1, losses: 0, draws: 0, noShows: 0, lateCancels: 0 },
  ]

  for (const stats of statsData) {
    await prisma.playerStats.upsert({
      where: { userId: stats.userId },
      update: {},
      create: stats,
    })
  }

  // ─── Player Badges ────────────────────────────────────────────────────────────

  // Admin: all three badges
  await prisma.playerBadge.upsert({
    where: { userId_badgeId: { userId: adminUser.id, badgeId: badgeIronBoot.id } },
    update: {},
    create: { userId: adminUser.id, badgeId: badgeIronBoot.id },
  })
  await prisma.playerBadge.upsert({
    where: { userId_badgeId: { userId: adminUser.id, badgeId: badgeCaptain.id } },
    update: {},
    create: { userId: adminUser.id, badgeId: badgeCaptain.id },
  })

  // Top scorer: Hat-Trick Hero
  await prisma.playerBadge.upsert({
    where: { userId_badgeId: { userId: createdPlayers[0].id, badgeId: badgeHatTrick.id } },
    update: {},
    create: { userId: createdPlayers[0].id, badgeId: badgeHatTrick.id },
  })
  await prisma.playerBadge.upsert({
    where: { userId_badgeId: { userId: createdPlayers[0].id, badgeId: badgeIronBoot.id } },
    update: {},
    create: { userId: createdPlayers[0].id, badgeId: badgeIronBoot.id },
  })

  // Several others: Iron Boot
  for (const player of createdPlayers.slice(1, 5)) {
    await prisma.playerBadge.upsert({
      where: { userId_badgeId: { userId: player.id, badgeId: badgeIronBoot.id } },
      update: {},
      create: { userId: player.id, badgeId: badgeIronBoot.id },
    })
  }

  console.log('Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
