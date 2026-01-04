// League/Rank definitions similar to Duolingo's system
export interface League {
  id: string;
  name: string;
  icon: string;
  color: string;
  minRank: number;  // Minimum rank in this league (1 = highest)
  maxRank: number;  // Maximum rank in this league
  promotionZone: number;  // Top N users get promoted
  demotionZone: number;   // Bottom N users get demoted
  safeZone: number;       // Middle users stay
}

export const LEAGUES: League[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    icon: '🥉',
    color: '#CD7F32',
    minRank: 1,
    maxRank: 30,
    promotionZone: 10,  // Top 10 promote
    demotionZone: 0,    // Can't demote from Bronze
    safeZone: 20,
  },
  {
    id: 'silver',
    name: 'Silver',
    icon: '🥈',
    color: '#C0C0C0',
    minRank: 1,
    maxRank: 30,
    promotionZone: 10,
    demotionZone: 5,    // Bottom 5 demote
    safeZone: 15,
  },
  {
    id: 'gold',
    name: 'Gold',
    icon: '🥇',
    color: '#FFD700',
    minRank: 1,
    maxRank: 30,
    promotionZone: 10,
    demotionZone: 5,
    safeZone: 15,
  },
  {
    id: 'platinum',
    name: 'Platinum',
    icon: '💎',
    color: '#E5E4E2',
    minRank: 1,
    maxRank: 30,
    promotionZone: 10,
    demotionZone: 5,
    safeZone: 15,
  },
  {
    id: 'diamond',
    name: 'Diamond',
    icon: '💠',
    color: '#B9F2FF',
    minRank: 1,
    maxRank: 30,
    promotionZone: 10,
    demotionZone: 5,
    safeZone: 15,
  },
  {
    id: 'master',
    name: 'Master',
    icon: '👑',
    color: '#9333EA',
    minRank: 1,
    maxRank: 30,
    promotionZone: 0,   // Can't promote from Master (top league)
    demotionZone: 5,
    safeZone: 25,
  },
];

export const getLeagueById = (id: string): League | undefined => {
  return LEAGUES.find(league => league.id === id);
};

export const getLeagueIndex = (id: string): number => {
  return LEAGUES.findIndex(league => league.id === id);
};

export const getNextLeague = (currentLeagueId: string): League | null => {
  const currentIndex = getLeagueIndex(currentLeagueId);
  if (currentIndex < 0 || currentIndex >= LEAGUES.length - 1) return null;
  return LEAGUES[currentIndex + 1];
};

export const getPreviousLeague = (currentLeagueId: string): League | null => {
  const currentIndex = getLeagueIndex(currentLeagueId);
  if (currentIndex <= 0) return null;
  return LEAGUES[currentIndex - 1];
};

export const getPromotionStatus = (league: League, rank: number): 'promote' | 'demote' | 'safe' => {
  if (rank <= league.promotionZone && league.promotionZone > 0) {
    return 'promote';
  }
  if (rank > league.maxRank - league.demotionZone && league.demotionZone > 0) {
    return 'demote';
  }
  return 'safe';
};

// Get the start of the current week (Monday 00:00:00 local time)
export const getWeekStart = (): Date => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust so Monday = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Get the end of the current week (Sunday 23:59:59 local time)
export const getWeekEnd = (): Date => {
  const weekStart = getWeekStart();
  const sunday = new Date(weekStart);
  sunday.setDate(weekStart.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
};

// Calculate time remaining in the week
export const getTimeRemainingInWeek = (): { days: number; hours: number; minutes: number } => {
  const now = new Date();
  const weekEnd = getWeekEnd();
  const diff = weekEnd.getTime() - now.getTime();
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
};

// Format time remaining as string
export const formatTimeRemaining = (): string => {
  const { days, hours, minutes } = getTimeRemainingInWeek();
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const DEFAULT_LEAGUE = LEAGUES[0]; // Bronze
