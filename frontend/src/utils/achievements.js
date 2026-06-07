/**
 * ============================================================
 * ACHIEVEMENT SYSTEM — 8 thành tích cho CaroOnline
 * ============================================================
 */

export const ACHIEVEMENTS = [
  {
    id: 'first_win',
    icon: '🏆',
    name: 'Chiến Thắng Đầu Tiên',
    description: 'Thắng ván online đầu tiên',
    check: (user) => user.wins >= 1,
  },
  {
    id: 'ten_wins',
    icon: '⚔️',
    name: 'Chiến Binh',
    description: 'Thắng 10 ván online',
    check: (user) => user.wins >= 10,
  },
  {
    id: 'fifty_wins',
    icon: '🔥',
    name: 'Huyền Thoại',
    description: 'Thắng 50 ván online',
    check: (user) => user.wins >= 50,
  },
  {
    id: 'elo_1400',
    icon: '💎',
    name: 'Kim Cương',
    description: 'Đạt Elo 1400+',
    check: (user) => user.elo >= 1400,
  },
  {
    id: 'elo_1600',
    icon: '👑',
    name: 'Cao Thủ',
    description: 'Đạt Elo 1600+',
    check: (user) => user.elo >= 1600,
  },
  {
    id: 'elo_1800',
    icon: '🌟',
    name: 'Đại Cao Thủ',
    description: 'Đạt Elo 1800+',
    check: (user) => user.elo >= 1800,
  },
  {
    id: 'played_25',
    icon: '🎯',
    name: 'Người Kiên Trì',
    description: 'Tham gia 25 ván online',
    check: (user) => user.matches_played >= 25,
  },
  {
    id: 'winrate_60',
    icon: '📈',
    name: 'Nhà Vô Địch',
    description: 'Đạt tỉ lệ thắng 60%+ với ≥10 ván',
    check: (user) => user.matches_played >= 10 && (user.wins / user.matches_played) >= 0.6,
  },
];

/**
 * Trả về danh sách achievement đã unlock dựa trên user object
 */
export const getUnlockedAchievements = (user) => {
  if (!user) return [];
  return ACHIEVEMENTS.map((ach) => ({
    ...ach,
    unlocked: ach.check(user),
  }));
};
