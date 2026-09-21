const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const gamificationEngine = require('../services/gamificationEngine');

router.post('/login', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  try {
    const result = gamificationEngine.recordLogin(userId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/complete-task', (req, res) => {
  const { userId, taskId } = req.body;
  if (!userId || !taskId) return res.status(400).json({ error: 'userId and taskId are required' });
  try {
    const result = gamificationEngine.completeDailyTask(userId, taskId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const getAllTasksStmt = db.prepare('SELECT task_id AS taskId, title, description, hazard_topic AS hazardTopic, points_awarded AS pointsAwarded FROM daily_tasks');
const getCompletedTodayStmt = db.prepare('SELECT task_id AS taskId FROM user_daily_task_completions WHERE user_id = ? AND completed_date = ?');

router.get('/tasks', (req, res) => {
  const { userId } = req.query;
  const tasks = getAllTasksStmt.all();
  let completedToday = [];
  if (userId) {
    const today = new Date().toISOString().split('T')[0];
    completedToday = getCompletedTodayStmt.all(userId, today).map((r) => r.taskId);
  }
  res.status(200).json({ tasks, completedToday });
});

router.post('/kit-complete', (req, res) => {
  const { userId, kitId } = req.body;
  if (!userId || !kitId) return res.status(400).json({ error: 'userId and kitId are required' });
  try {
    let result = gamificationEngine.awardPoints(userId, 30);
    const badgeMap = { 'flood_kids': 'flood_kids', 'earthquake_kids': 'earthquake_kids', 'fire_kids': 'fire_kids' };
    const badgeId = badgeMap[kitId];
    if (badgeId) result = gamificationEngine.awardBadge(userId, badgeId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/story-complete', (req, res) => {
  const { userId, storyId } = req.body;
  if (!userId || !storyId) return res.status(400).json({ error: 'userId and storyId are required' });
  try {
    const result = gamificationEngine.awardPoints(userId, 30);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const MINIGAME_BADGES = {
  flood_route: 'route_hero',
  earthquake_sequence: 'sequence_hero',
  fire_safehouse: 'safehouse_hero',
  dispatch_hero: 'dispatch_hero'
};

router.post('/minigame-complete', (req, res) => {
  const { userId, gameId, xp } = req.body;
  if (!userId || !gameId) return res.status(400).json({ error: 'userId and gameId are required' });
  try {
    let result = gamificationEngine.awardPoints(userId, Number.isFinite(xp) && xp > 0 ? xp : 25);
    const badgeId = MINIGAME_BADGES[gameId];
    if (badgeId) result = gamificationEngine.awardBadge(userId, badgeId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const userExistsStmt = db.prepare('SELECT 1 FROM users WHERE id = ?');
const getFamilyPlanStmt = db.prepare('SELECT * FROM user_family_plans WHERE user_id = ?');
const getCallOrderStmt = db.prepare('SELECT member_id AS memberId FROM user_family_plan_call_order WHERE user_id = ? ORDER BY call_position');
const getGoBagStmt = db.prepare('SELECT item_id AS itemId FROM user_family_plan_go_bag WHERE user_id = ?');

function readFamilyPlan(userId) {
  const plan = getFamilyPlanStmt.get(userId);
  if (!plan) return null;
  return {
    meetingPoint: { id: plan.meeting_point_id, label: plan.meeting_point_label, detail: plan.meeting_point_detail || undefined },
    callOrder: getCallOrderStmt.all(userId).map((r) => r.memberId),
    goBag: getGoBagStmt.all(userId).map((r) => r.itemId),
    savedAt: plan.saved_at
  };
}

router.get('/family-plan', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  res.status(200).json({ familyPlan: readFamilyPlan(userId) });
});

const upsertFamilyPlanStmt = db.prepare(`
  INSERT INTO user_family_plans (user_id, meeting_point_id, meeting_point_label, meeting_point_detail, saved_at)
  VALUES (@user_id, @meeting_point_id, @meeting_point_label, @meeting_point_detail, @saved_at)
  ON CONFLICT(user_id) DO UPDATE SET
    meeting_point_id = excluded.meeting_point_id,
    meeting_point_label = excluded.meeting_point_label,
    meeting_point_detail = excluded.meeting_point_detail,
    saved_at = excluded.saved_at
`);
const deleteCallOrderStmt = db.prepare('DELETE FROM user_family_plan_call_order WHERE user_id = ?');
const insertCallOrderStmt = db.prepare('INSERT INTO user_family_plan_call_order (user_id, member_id, call_position) VALUES (?, ?, ?)');
const deleteGoBagStmt = db.prepare('DELETE FROM user_family_plan_go_bag WHERE user_id = ?');
const insertGoBagItemStmt = db.prepare('INSERT INTO user_family_plan_go_bag (user_id, item_id) VALUES (?, ?)');

// The plan itself plus its two ordered/unordered child lists are one save
// from the user's point of view — replacing all three tables' rows for
// this user happens in a single transaction so a save can't be left with,
// say, a new meeting point but a stale go-bag list.
const saveFamilyPlanTx = db.transaction((userId, meetingPoint, callOrder, goBag, savedAt) => {
  upsertFamilyPlanStmt.run({
    user_id: userId,
    meeting_point_id: meetingPoint.id,
    meeting_point_label: meetingPoint.label,
    meeting_point_detail: meetingPoint.detail || null,
    saved_at: savedAt
  });
  deleteCallOrderStmt.run(userId);
  callOrder.forEach((memberId, i) => insertCallOrderStmt.run(userId, memberId, i));
  deleteGoBagStmt.run(userId);
  goBag.forEach((itemId) => insertGoBagItemStmt.run(userId, itemId));
});

router.post('/family-plan', (req, res) => {
  const { userId, meetingPoint, callOrder, goBag } = req.body;
  if (!userId || !meetingPoint || !callOrder || !goBag) {
    return res.status(400).json({ error: 'userId, meetingPoint, callOrder and goBag are required' });
  }
  if (!userExistsStmt.get(userId)) return res.status(404).json({ error: 'User not found' });

  const isFirstSave = !getFamilyPlanStmt.get(userId);
  const savedAt = new Date().toISOString();
  saveFamilyPlanTx(userId, meetingPoint, callOrder, goBag, savedAt);

  let result = gamificationEngine.getFullUserState(userId);
  if (isFirstSave) {
    gamificationEngine.awardPoints(userId, 40);
    result = gamificationEngine.awardBadge(userId, 'family_planner');
  }

  res.status(200).json({ ...result, familyPlan: readFamilyPlan(userId) });
});

const getCompletedLessonsStmt = db.prepare('SELECT lesson_id AS lessonId FROM user_completed_lessons WHERE user_id = ?');
const insertCompletedLessonStmt = db.prepare('INSERT OR IGNORE INTO user_completed_lessons (user_id, lesson_id) VALUES (?, ?)');

router.get('/lessons', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  const completedLessons = getCompletedLessonsStmt.all(userId).map((r) => r.lessonId);
  res.status(200).json({ completedLessons });
});

router.post('/lesson-complete', (req, res) => {
  const { userId, lessonId, xp } = req.body;
  if (!userId || !lessonId) return res.status(400).json({ error: 'userId and lessonId are required' });
  if (!userExistsStmt.get(userId)) return res.status(404).json({ error: 'User not found' });

  const alreadyDone = getCompletedLessonsStmt.all(userId).some((r) => r.lessonId === lessonId);
  insertCompletedLessonStmt.run(userId, lessonId);

  const result = !alreadyDone
    ? gamificationEngine.awardPoints(userId, Number.isFinite(xp) && xp > 0 ? xp : 20)
    : gamificationEngine.getFullUserState(userId);

  const completedLessons = getCompletedLessonsStmt.all(userId).map((r) => r.lessonId);
  res.status(200).json({ ...result, completedLessons, alreadyDone });
});

const getCompletedChaptersStmt = db.prepare('SELECT chapter_id AS chapterId FROM user_completed_knowledge_chapters WHERE user_id = ?');
const insertCompletedChapterStmt = db.prepare('INSERT OR IGNORE INTO user_completed_knowledge_chapters (user_id, chapter_id) VALUES (?, ?)');

router.get('/knowledge-chapters', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  const completedChapters = getCompletedChaptersStmt.all(userId).map((r) => r.chapterId);
  res.status(200).json({ completedChapters });
});

router.post('/knowledge-chapter-complete', (req, res) => {
  const { userId, chapterId, xp, totalChapters } = req.body;
  if (!userId || !chapterId) return res.status(400).json({ error: 'userId and chapterId are required' });
  if (!userExistsStmt.get(userId)) return res.status(404).json({ error: 'User not found' });

  const alreadyDone = getCompletedChaptersStmt.all(userId).some((r) => r.chapterId === chapterId);
  insertCompletedChapterStmt.run(userId, chapterId);

  let result = !alreadyDone
    ? gamificationEngine.awardPoints(userId, Number.isFinite(xp) && xp > 0 ? xp : 10)
    : gamificationEngine.getFullUserState(userId);

  const completedChapters = getCompletedChaptersStmt.all(userId).map((r) => r.chapterId);

  let justCompletedAll = false;
  if (Number.isFinite(totalChapters) && completedChapters.length >= totalChapters) {
    const hadBadge = result.badges.includes('knowledge_check_complete');
    result = gamificationEngine.awardBadge(userId, 'knowledge_check_complete');
    justCompletedAll = !hadBadge;
  }

  res.status(200).json({ ...result, completedChapters, alreadyDone, justCompletedAll });
});

module.exports = router;
