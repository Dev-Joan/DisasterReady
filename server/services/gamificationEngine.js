const db = require('../db/connection');

const STREAK_FREEZE_CAP = 2;

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(dateStr, todayDateStr) {
  return Math.round((new Date(todayDateStr) - new Date(dateStr)) / (1000 * 60 * 60 * 24));
}

function isYesterday(lastDateStr, todayDateStr) {
  if (!lastDateStr) return false;
  const diffDays = (new Date(todayDateStr) - new Date(lastDateStr)) / (1000 * 60 * 60 * 24);
  return diffDays === 1;
}

function calculateRank(points) {
  if (points >= 600) return 'Guardian';
  if (points >= 300) return 'Resilient';
  if (points >= 100) return 'Prepared';
  return 'Novice';
}

const getStateStmt = db.prepare('SELECT * FROM gamification_state WHERE user_id = ?');
const getBadgesStmt = db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ? ORDER BY earned_at');
const getTaskCompletionsStmt = db.prepare('SELECT task_id AS taskId, completed_date AS date FROM user_daily_task_completions WHERE user_id = ?');
const insertUserBadgeStmt = db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)');

const updatePointsStmt = db.prepare(`
  UPDATE gamification_state SET points = @points, rank = @rank, daily_xp_earned = @daily_xp_earned, daily_xp_date = @daily_xp_date
  WHERE user_id = @user_id
`);
const updateStreakStmt = db.prepare(`
  UPDATE gamification_state SET current_streak = @current_streak, longest_streak = @longest_streak,
    streak_freezes = @streak_freezes, last_active_date = @last_active_date
  WHERE user_id = @user_id
`);
const insertTaskCompletionStmt = db.prepare('INSERT INTO user_daily_task_completions (user_id, task_id, completed_date) VALUES (?, ?, ?)');
const findTaskCompletionStmt = db.prepare('SELECT 1 FROM user_daily_task_completions WHERE user_id = ? AND task_id = ? AND completed_date = ?');
const findDailyTaskStmt = db.prepare('SELECT * FROM daily_tasks WHERE task_id = ?');

// Assembles the same shape the old JSON per-user object had (camelCase
// field names, `badges` and `dailyTasksCompleted` as arrays) so every route
// response stays byte-for-byte compatible with what the frontend expects,
// even though the data now lives across four normalized tables.
function getFullUserState(userId) {
  const row = getStateStmt.get(userId);
  if (!row) throw new Error('User gamification state not found');

  return {
    userId: row.user_id,
    points: row.points,
    rank: row.rank,
    badges: getBadgesStmt.all(userId).map((b) => b.badge_id),
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastActiveDate: row.last_active_date,
    dailyTasksCompleted: getTaskCompletionsStmt.all(userId),
    streakFreezes: row.streak_freezes,
    dailyGoalXp: row.daily_goal_xp,
    dailyXpEarned: row.daily_xp_earned,
    dailyXpDate: row.daily_xp_date
  };
}

const RANK_BADGE_MAP = { Prepared: 'rank_prepared', Resilient: 'rank_resilient', Guardian: 'rank_guardian' };

// Points, daily-XP bookkeeping, and a possible rank-up badge award are one
// logical action from the caller's point of view, so they commit together.
const awardPointsTx = db.transaction((userId, points) => {
  const row = getStateStmt.get(userId);
  if (!row) throw new Error('User gamification state not found');

  const newPoints = row.points + points;
  const today = todayStr();
  const dailyXpEarned = (row.daily_xp_date === today ? row.daily_xp_earned : 0) + points;
  const newRank = calculateRank(newPoints);

  updatePointsStmt.run({ user_id: userId, points: newPoints, rank: newRank, daily_xp_earned: dailyXpEarned, daily_xp_date: today });

  const badgeId = RANK_BADGE_MAP[newRank];
  if (newRank !== row.rank && badgeId) {
    insertUserBadgeStmt.run(userId, badgeId);
  }
});

function awardPoints(userId, points) {
  awardPointsTx(userId, points);
  return getFullUserState(userId);
}

function awardBadge(userId, badgeId) {
  insertUserBadgeStmt.run(userId, badgeId);
  return getFullUserState(userId);
}

function awardTopicMasteryBadge(userId, topic) {
  return awardBadge(userId, `${topic}_mastered`);
}

// Streak calculation, a possible 7-day-streak badge, and a possible earned
// freeze are all one atomic outcome of "the user logged in today".
const recordLoginTx = db.transaction((userId) => {
  const row = getStateStmt.get(userId);
  if (!row) throw new Error('User gamification state not found');

  const today = todayStr();
  const lastDate = row.last_active_date;
  let currentStreak = row.current_streak;
  let streakFreezes = row.streak_freezes;
  let usedFreeze = false;

  if (lastDate === today) {
    // already logged in today, no change
  } else if (isYesterday(lastDate, today)) {
    currentStreak += 1;
  } else if (lastDate && daysBetween(lastDate, today) === 2 && streakFreezes > 0) {
    streakFreezes -= 1;
    currentStreak += 1;
    usedFreeze = true;
  } else {
    currentStreak = 1;
  }

  const longestStreak = Math.max(currentStreak, row.longest_streak);

  if (currentStreak === 7) {
    insertUserBadgeStmt.run(userId, 'streak_7');
  }

  if (currentStreak > 0 && currentStreak % 7 === 0) {
    streakFreezes = Math.min(streakFreezes + 1, STREAK_FREEZE_CAP);
  }

  updateStreakStmt.run({ user_id: userId, current_streak: currentStreak, longest_streak: longestStreak, streak_freezes: streakFreezes, last_active_date: today });

  return usedFreeze;
});

function recordLogin(userId) {
  const usedFreeze = recordLoginTx(userId);
  return { ...getFullUserState(userId), usedFreeze };
}

// Recording a completion and awarding its points are one action: if the
// points award somehow failed, the completion shouldn't be recorded either
// (it would otherwise permanently block re-attempting that task today).
const completeDailyTaskTx = db.transaction((userId, taskId, task) => {
  const today = todayStr();
  if (findTaskCompletionStmt.get(userId, taskId, today)) {
    throw new Error('Task already completed today');
  }
  insertTaskCompletionStmt.run(userId, taskId, today);
  awardPointsTx(userId, task.points_awarded);
});

function completeDailyTask(userId, taskId) {
  if (!getStateStmt.get(userId)) throw new Error('User gamification state not found');
  const task = findDailyTaskStmt.get(taskId);
  if (!task) throw new Error('Task not found');

  completeDailyTaskTx(userId, taskId, task);
  return getFullUserState(userId);
}

module.exports = {
  awardPoints,
  awardBadge,
  awardTopicMasteryBadge,
  recordLogin,
  completeDailyTask,
  calculateRank,
  getFullUserState
};
