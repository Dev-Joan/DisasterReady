const fs = require('fs');
const path = require('path');
const db = require('../db/connection');
const dataDir = path.join(__dirname, '../data');
const readJson = name => JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8'));
const EXTRA_BADGES = [{
  badgeId: 'family_planner',
  title: 'Family Planner',
  description: 'Saved a household family emergency plan.'
}, {
  badgeId: 'route_hero',
  title: 'Route Hero',
  description: 'Completed the flood evacuation route challenge.'
}, {
  badgeId: 'sequence_hero',
  title: 'Sequence Hero',
  description: 'Completed the earthquake response sequence challenge.'
}, {
  badgeId: 'safehouse_hero',
  title: 'Safehouse Hero',
  description: 'Completed the fire safehouse challenge.'
}, {
  badgeId: 'dispatch_hero',
  title: 'Dispatch Hero',
  description: 'Completed the emergency dispatch challenge.'
}, {
  badgeId: 'safe_spot_hero',
  title: 'Safe Spot Hero',
  description: 'Found every hidden hazard and aced the Drop, Cover, Hold drill.'
}, {
  badgeId: 'hazard_hero',
  title: 'Hazard Hero',
  description: 'Escaped the smoke-filled building, dodging water and live wires.'
}, {
  badgeId: 'scenario_strategist',
  title: 'Scenario Strategist',
  description: 'Made the right call under pressure in the timed scenario challenge.'
}];
function ensureStreakDefaults(g) {
  return {
    streakFreezes: g.streakFreezes ?? 0,
    dailyGoalXp: g.dailyGoalXp ?? 30,
    dailyXpEarned: g.dailyXpEarned ?? 0,
    dailyXpDate: g.dailyXpDate ?? null
  };
}
function main() {
  const alreadyMigrated = db.prepare('SELECT COUNT(*) AS n FROM users').get().n > 0;
  if (alreadyMigrated) {
    console.error('Refusing to run: `users` table already has rows. This script is one-time-use only.');
    process.exit(1);
  }
  const users = readJson('users.json');
  const gamificationState = readJson('gamificationState.json');
  const badgesCatalog = readJson('badges.json');
  const dailyTasksCatalog = readJson('dailyTasks.json');
  const quizBank = readJson('quizBank.json');
  const legacyQuizState = readJson('quizState.json');
  const bktState = readJson('bktState.json');
  const alerts = readJson('alerts.json');
  const counts = {};
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, name, age, region, country, theme)
    VALUES (@id, @username, @password_hash, @name, @age, @region, @country, @theme)
  `);
  const insertFlag = db.prepare('INSERT INTO user_accessibility_flags (user_id, flag) VALUES (?, ?)');
  const insertBadgeCatalog = db.prepare('INSERT INTO badges (badge_id, title, description) VALUES (?, ?, ?)');
  const insertUserBadge = db.prepare('INSERT INTO user_badges (user_id, badge_id, earned_at) VALUES (?, ?, ?)');
  const insertDailyTaskCatalog = db.prepare(`
    INSERT INTO daily_tasks (task_id, title, description, hazard_topic, points_awarded)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertDailyTaskCompletion = db.prepare(`
    INSERT INTO user_daily_task_completions (user_id, task_id, completed_date) VALUES (?, ?, ?)
  `);
  const insertQuizQuestion = db.prepare(`
    INSERT INTO quiz_questions (question_id, topic, difficulty, text, correct_answer, explanation)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertGamification = db.prepare(`
    INSERT INTO gamification_state
      (user_id, points, rank, current_streak, longest_streak, last_active_date,
       streak_freezes, daily_goal_xp, daily_xp_earned, daily_xp_date)
    VALUES (@user_id, @points, @rank, @current_streak, @longest_streak, @last_active_date,
            @streak_freezes, @daily_goal_xp, @daily_xp_earned, @daily_xp_date)
  `);
  const insertLegacyState = db.prepare(`
    INSERT INTO legacy_quiz_state (user_id, topic, current_difficulty, mastered) VALUES (?, ?, ?, ?)
  `);
  const insertLegacyHistory = db.prepare(`
    INSERT INTO legacy_quiz_answer_history (user_id, topic, attempt_number, was_correct) VALUES (?, ?, ?, ?)
  `);
  const insertBktState = db.prepare(`
    INSERT INTO bkt_state (user_id, skill, p_mastery, attempts, correct_count, mastered)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertBktHistory = db.prepare(`
    INSERT INTO bkt_answer_history (user_id, skill, attempt_number, was_correct, p_before, posterior, p_after)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAlert = db.prepare(`
    INSERT INTO alerts (alert_id, severity, hazard, region, message, active) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertFamilyPlan = db.prepare(`
    INSERT INTO user_family_plans (user_id, meeting_point_id, meeting_point_label, meeting_point_detail, saved_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertCallOrder = db.prepare('INSERT INTO user_family_plan_call_order (user_id, member_id, call_position) VALUES (?, ?, ?)');
  const insertGoBagItem = db.prepare('INSERT INTO user_family_plan_go_bag (user_id, item_id) VALUES (?, ?)');
  const insertCompletedLesson = db.prepare('INSERT INTO user_completed_lessons (user_id, lesson_id) VALUES (?, ?)');
  const insertCompletedChapter = db.prepare('INSERT INTO user_completed_knowledge_chapters (user_id, chapter_id) VALUES (?, ?)');
  const importAll = db.transaction(() => {
    for (const b of badgesCatalog) insertBadgeCatalog.run(b.badgeId, b.title, b.description || null);
    for (const b of EXTRA_BADGES) insertBadgeCatalog.run(b.badgeId, b.title, b.description);
    counts.badges = badgesCatalog.length + EXTRA_BADGES.length;
    for (const t of dailyTasksCatalog) {
      insertDailyTaskCatalog.run(t.taskId, t.title, t.description || null, t.hazardTopic || null, t.pointsAwarded);
    }
    counts.daily_tasks = dailyTasksCatalog.length;
    for (const q of quizBank) {
      insertQuizQuestion.run(q.questionId, q.topic, q.difficulty, q.text, q.correctAnswer, q.explanation || null);
    }
    counts.quiz_questions = quizBank.length;
    for (const a of alerts) {
      insertAlert.run(a.alertId, a.severity, a.hazard, a.region, a.message, a.active ? 1 : 0);
    }
    counts.alerts = alerts.length;
    for (const u of users) {
      insertUser.run({
        id: u.userId,
        username: u.username,
        password_hash: u.password,
        name: u.name || null,
        age: u.age ?? null,
        region: u.region || null,
        country: u.country || null,
        theme: u.theme || 'light'
      });
      for (const flag of u.accessibilityFlags || []) insertFlag.run(u.userId, flag);
    }
    counts.users = users.length;
    let badgeCount = 0,
      taskCompletionCount = 0,
      familyPlanCount = 0,
      lessonCount = 0,
      chapterCount = 0;
    const migratedAt = new Date().toISOString();
    for (const g of gamificationState) {
      const defaults = ensureStreakDefaults(g);
      insertGamification.run({
        user_id: g.userId,
        points: g.points ?? 0,
        rank: g.rank || 'Novice',
        current_streak: g.currentStreak ?? 0,
        longest_streak: g.longestStreak ?? 0,
        last_active_date: g.lastActiveDate ?? null,
        streak_freezes: defaults.streakFreezes,
        daily_goal_xp: defaults.dailyGoalXp,
        daily_xp_earned: defaults.dailyXpEarned,
        daily_xp_date: defaults.dailyXpDate
      });
      for (const badgeId of g.badges || []) {
        insertUserBadge.run(g.userId, badgeId, migratedAt);
        badgeCount++;
      }
      for (const entry of g.dailyTasksCompleted || []) {
        insertDailyTaskCompletion.run(g.userId, entry.taskId, entry.date);
        taskCompletionCount++;
      }
      if (g.familyPlan) {
        insertFamilyPlan.run(g.userId, g.familyPlan.meetingPoint.id, g.familyPlan.meetingPoint.label, g.familyPlan.meetingPoint.detail || null, g.familyPlan.savedAt);
        (g.familyPlan.callOrder || []).forEach((memberId, i) => insertCallOrder.run(g.userId, memberId, i));
        (g.familyPlan.goBag || []).forEach(itemId => insertGoBagItem.run(g.userId, itemId));
        familyPlanCount++;
      }
      for (const lessonId of g.completedLessons || []) {
        insertCompletedLesson.run(g.userId, lessonId);
        lessonCount++;
      }
      for (const chapterId of g.completedKnowledgeChapters || []) {
        insertCompletedChapter.run(g.userId, chapterId);
        chapterCount++;
      }
    }
    counts.gamification_state = gamificationState.length;
    counts.user_badges = badgeCount;
    counts.user_daily_task_completions = taskCompletionCount;
    counts.user_family_plans = familyPlanCount;
    counts.user_completed_lessons = lessonCount;
    counts.user_completed_knowledge_chapters = chapterCount;
    let legacyStateCount = 0,
      legacyHistoryCount = 0;
    for (const [userId, topics] of Object.entries(legacyQuizState)) {
      for (const [topic, t] of Object.entries(topics)) {
        insertLegacyState.run(userId, topic, t.currentDifficulty, t.mastered ? 1 : 0);
        legacyStateCount++;
        (t.history || []).forEach((wasCorrect, i) => {
          insertLegacyHistory.run(userId, topic, i + 1, wasCorrect ? 1 : 0);
          legacyHistoryCount++;
        });
      }
    }
    counts.legacy_quiz_state = legacyStateCount;
    counts.legacy_quiz_answer_history = legacyHistoryCount;
    let bktStateCount = 0,
      bktHistoryCount = 0;
    for (const [userId, skills] of Object.entries(bktState)) {
      for (const [skill, s] of Object.entries(skills)) {
        insertBktState.run(userId, skill, s.pMastery, s.attempts, s.correctCount, s.mastered ? 1 : 0);
        bktStateCount++;
        (s.history || []).forEach(h => {
          insertBktHistory.run(userId, skill, h.attempt, h.wasCorrect ? 1 : 0, h.pBefore, h.posterior, h.pAfter);
          bktHistoryCount++;
        });
      }
    }
    counts.bkt_state = bktStateCount;
    counts.bkt_answer_history = bktHistoryCount;
  });
  importAll();
  console.log('Migration complete. Rows imported:');
  Object.entries(counts).forEach(([table, n]) => console.log(`  ${table.padEnd(34)} ${n}`));
  console.log('\nVerification (DB row counts vs. imported counts):');
  let allOk = true;
  for (const table of Object.keys(counts)) {
    const dbCount = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
    const ok = dbCount === counts[table];
    if (!ok) allOk = false;
    console.log(`  ${table.padEnd(34)} db=${dbCount} imported=${counts[table]} ${ok ? 'OK' : 'MISMATCH'}`);
  }
  if (!allOk) {
    console.error('\nVerification FAILED - see MISMATCH rows above.');
    process.exit(1);
  }
  console.log('\nAll row counts verified.');
}
main();
