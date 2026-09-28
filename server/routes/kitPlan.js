const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const userExistsStmt = db.prepare('SELECT 1 FROM users WHERE id = ?');
const getPlanStmt = db.prepare('SELECT household_size AS householdSize, days_target AS daysTarget, updated_at AS updatedAt FROM user_kit_plans WHERE user_id = ?');
const getItemsStmt = db.prepare('SELECT item_id AS itemId, have_qty AS haveQty FROM user_kit_items WHERE user_id = ?');
function readKitPlan(userId) {
  const plan = getPlanStmt.get(userId);
  const items = {};
  getItemsStmt.all(userId).forEach(row => {
    items[row.itemId] = row.haveQty;
  });
  if (!plan) return {
    householdSize: 1,
    daysTarget: 3,
    updatedAt: null,
    items
  };
  return {
    ...plan,
    items
  };
}
router.get('/', (req, res) => {
  const {
    userId
  } = req.query;
  if (!userId) return res.status(400).json({
    error: 'userId is required'
  });
  res.status(200).json(readKitPlan(userId));
});
const upsertPlanStmt = db.prepare(`
  INSERT INTO user_kit_plans (user_id, household_size, days_target, updated_at)
  VALUES (@user_id, @household_size, @days_target, @updated_at)
  ON CONFLICT(user_id) DO UPDATE SET
    household_size = excluded.household_size,
    days_target = excluded.days_target,
    updated_at = excluded.updated_at
`);
const deleteItemsStmt = db.prepare('DELETE FROM user_kit_items WHERE user_id = ?');
const insertItemStmt = db.prepare('INSERT INTO user_kit_items (user_id, item_id, have_qty) VALUES (?, ?, ?)');
const saveKitPlanTx = db.transaction((userId, householdSize, daysTarget, items, updatedAt) => {
  upsertPlanStmt.run({
    user_id: userId,
    household_size: householdSize,
    days_target: daysTarget,
    updated_at: updatedAt
  });
  deleteItemsStmt.run(userId);
  Object.entries(items).forEach(([itemId, haveQty]) => {
    const qty = Number(haveQty);
    if (Number.isFinite(qty) && qty > 0) insertItemStmt.run(userId, itemId, qty);
  });
});
router.post('/', (req, res) => {
  const {
    userId,
    householdSize,
    daysTarget,
    items
  } = req.body;
  if (!userId || !Number.isFinite(householdSize) || !Number.isFinite(daysTarget) || typeof items !== 'object' || items === null) {
    return res.status(400).json({
      error: 'userId, householdSize, daysTarget, and items are required'
    });
  }
  if (!userExistsStmt.get(userId)) return res.status(404).json({
    error: 'User not found'
  });
  const updatedAt = new Date().toISOString();
  saveKitPlanTx(userId, Math.round(householdSize), Math.round(daysTarget), items, updatedAt);
  res.status(200).json(readKitPlan(userId));
});
module.exports = router;
