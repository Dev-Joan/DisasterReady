-- ============================================================================
-- DisasteReady relational schema (SQLite)
-- ============================================================================
-- Replaces the previous per-feature JSON files (data/users.json,
-- data/gamificationState.json, data/quizState.json, data/bktState.json,
-- data/badges.json, data/dailyTasks.json, data/alerts.json) with a single
-- normalized SQLite database. The RAG corpus/embeddings (data/ragCorpus.json,
-- data/corpusEmbeddings.json) are NOT part of this migration — they remain
-- flat files by design (see services/ragService.js).
--
-- DESIGN NOTES — a few fields that existed in the JSON files are
-- deliberately NOT columns here, because they were always fully derived
-- from other stored fields, and storing them too would just be a second,
-- driftable copy of the same fact (this is exactly the bug class fixed
-- earlier in services/accessibilityEngine.js, where two hand-written
-- copies of the same mapping had quietly diverged):
--   - users.experienceMode      -> derived from age via mapAgeToExperienceMode()
--   - users.relevantHazards     -> derived from country via mapCountryToHazards()
--   - users.accessibilitySettings -> derived from accessibility flags via
--                                     the accessibility engine
-- All three are (re)computed by the service layer on read, from columns
-- that ARE stored (age, country, and user_accessibility_flags).
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- USERS
-- ----------------------------------------------------------------------------
-- `id` reuses the existing "u_<timestamp>" string form (not a new surrogate
-- integer) so every foreign key elsewhere, and the public API contract with
-- the frontend, is unchanged by this migration.
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT,
  age           INTEGER,
  region        TEXT,
  country       TEXT,
  theme         TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- A user can have any subset of these five self-reported accessibility
-- flags — a proper many-valued attribute, normalized into its own table
-- rather than a comma-separated/JSON blob column.
CREATE TABLE IF NOT EXISTS user_accessibility_flags (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flag    TEXT NOT NULL CHECK (flag IN ('visual', 'hearing', 'motor', 'cognitive', 'motion')),
  PRIMARY KEY (user_id, flag)
);

-- ----------------------------------------------------------------------------
-- GAMIFICATION STATE (one row per user)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gamification_state (
  user_id           TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  points            INTEGER NOT NULL DEFAULT 0,
  rank              TEXT NOT NULL DEFAULT 'Novice' CHECK (rank IN ('Novice', 'Prepared', 'Resilient', 'Guardian')),
  current_streak    INTEGER NOT NULL DEFAULT 0,
  longest_streak    INTEGER NOT NULL DEFAULT 0,
  last_active_date  TEXT,
  streak_freezes    INTEGER NOT NULL DEFAULT 0,
  daily_goal_xp     INTEGER NOT NULL DEFAULT 30,
  daily_xp_earned   INTEGER NOT NULL DEFAULT 0,
  daily_xp_date     TEXT
);

-- ----------------------------------------------------------------------------
-- BADGES — a catalog table (what a badge IS) plus a join table (who has it).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
  badge_id    TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id  TEXT NOT NULL REFERENCES badges(badge_id),
  earned_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, badge_id)
);

-- ----------------------------------------------------------------------------
-- DAILY TASKS — a catalog table plus a per-user, per-date completion log.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_tasks (
  task_id        TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT,
  hazard_topic   TEXT,
  points_awarded INTEGER NOT NULL
);

-- A task can be completed again on a later day, so the natural key includes
-- the date, not just (user, task).
CREATE TABLE IF NOT EXISTS user_daily_task_completions (
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id        TEXT NOT NULL REFERENCES daily_tasks(task_id),
  completed_date TEXT NOT NULL,
  PRIMARY KEY (user_id, task_id, completed_date)
);

-- ----------------------------------------------------------------------------
-- QUIZ QUESTION BANK — reference content, shared by both quiz engines.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_questions (
  question_id     TEXT PRIMARY KEY,
  topic           TEXT NOT NULL,
  difficulty      INTEGER NOT NULL,
  text            TEXT NOT NULL,
  correct_answer  TEXT NOT NULL,
  explanation     TEXT
);

-- ----------------------------------------------------------------------------
-- LEGACY QUIZ ENGINE STATE (services/quizEngine.js — rolling-accuracy
-- baseline, kept as a documented fallback/comparison engine).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legacy_quiz_state (
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic              TEXT NOT NULL,
  current_difficulty INTEGER NOT NULL DEFAULT 1,
  mastered           INTEGER NOT NULL DEFAULT 0 CHECK (mastered IN (0, 1)),
  PRIMARY KEY (user_id, topic)
);

-- Every answer is kept (not just the trailing window) for a full audit
-- trail; the engine's "rolling accuracy over the last 5 answers" logic is
-- reproduced with `ORDER BY attempt_number DESC LIMIT 5` at query time
-- rather than by physically deleting older rows, so no information is lost
-- versus the old JSON behaviour (which discarded them) — a strict
-- improvement, not a behaviour change to the accuracy calculation itself.
CREATE TABLE IF NOT EXISTS legacy_quiz_answer_history (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         TEXT NOT NULL,
  topic           TEXT NOT NULL,
  attempt_number  INTEGER NOT NULL,
  was_correct     INTEGER NOT NULL CHECK (was_correct IN (0, 1)),
  FOREIGN KEY (user_id, topic) REFERENCES legacy_quiz_state(user_id, topic) ON DELETE CASCADE,
  UNIQUE (user_id, topic, attempt_number)
);

-- ----------------------------------------------------------------------------
-- BKT ENGINE STATE (services/bktEngine.js — the live default engine).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bkt_state (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill         TEXT NOT NULL,
  p_mastery     REAL NOT NULL,
  attempts      INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  mastered      INTEGER NOT NULL DEFAULT 0 CHECK (mastered IN (0, 1)),
  PRIMARY KEY (user_id, skill)
);

-- The old JSON engine capped this at 50 entries purely to bound file size;
-- that cap never fed back into the Bayesian math (pMastery/attempts/
-- correctCount are independent running fields), and it was never returned
-- by any API response, so keeping the full trajectory here is free and
-- strictly better evaluation evidence, not a behaviour change.
CREATE TABLE IF NOT EXISTS bkt_answer_history (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        TEXT NOT NULL,
  skill          TEXT NOT NULL,
  attempt_number INTEGER NOT NULL,
  was_correct    INTEGER NOT NULL CHECK (was_correct IN (0, 1)),
  p_before       REAL NOT NULL,
  posterior      REAL NOT NULL,
  p_after        REAL NOT NULL,
  FOREIGN KEY (user_id, skill) REFERENCES bkt_state(user_id, skill) ON DELETE CASCADE,
  UNIQUE (user_id, skill, attempt_number)
);

-- ----------------------------------------------------------------------------
-- ALERTS — generated by services/advisoryEngine.js, replacing the old
-- hand-written simulated rows. Keyed by COUNTRY (the same granularity as
-- weather_cache, and what the old `region` column's values actually were —
-- "Lebanon", "UK", etc. — despite the confusing name; renamed here to match).
--
-- `alert_id` is a deterministic composite key (see advisoryEngine.js), so
-- refreshing a country's advisories UPSERTs existing rows instead of
-- accumulating duplicates every refresh cycle.
--
-- `source` records which layer produced the row (see advisoryEngine.js's
-- header comment for the full two-layer design) — surfaced to the frontend
-- so users can see whether an advisory is an official government warning
-- or a derived-from-forecast estimate.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
  alert_id      TEXT PRIMARY KEY,
  country       TEXT NOT NULL,
  hazard        TEXT NOT NULL,
  severity      TEXT NOT NULL CHECK (severity IN ('advisory', 'warning', 'critical')),
  source        TEXT NOT NULL CHECK (source IN ('official', 'derived')),
  message       TEXT NOT NULL,
  active        INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  generated_at  TEXT NOT NULL,
  expires_at    TEXT
);

-- ----------------------------------------------------------------------------
-- FAMILY PLAN (one optional plan per user; call order and go-bag are
-- ordered/unordered lists respectively, normalized into their own tables
-- rather than JSON blob columns).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_family_plans (
  user_id             TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  meeting_point_id    TEXT NOT NULL,
  meeting_point_label TEXT NOT NULL,
  meeting_point_detail TEXT,
  saved_at            TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_family_plan_call_order (
  user_id       TEXT NOT NULL REFERENCES user_family_plans(user_id) ON DELETE CASCADE,
  member_id     TEXT NOT NULL,
  call_position INTEGER NOT NULL,
  PRIMARY KEY (user_id, call_position)
);

CREATE TABLE IF NOT EXISTS user_family_plan_go_bag (
  user_id TEXT NOT NULL REFERENCES user_family_plans(user_id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  PRIMARY KEY (user_id, item_id)
);

-- ----------------------------------------------------------------------------
-- LESSONS / KNOWLEDGE CHECK CHAPTERS COMPLETED
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_completed_lessons (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS user_completed_knowledge_chapters (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id   TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, chapter_id)
);

-- ----------------------------------------------------------------------------
-- WEATHER CACHE (services/weatherService.js) — one row per supported
-- country. Not per-user: weather depends on location, not identity, so
-- every user in the same country shares one cached fetch. `payload` holds
-- the already-shaped {current, forecast} JSON so the service doesn't need
-- to re-parse the raw Open-Meteo response on every cache hit.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weather_cache (
  country     TEXT PRIMARY KEY,
  latitude    REAL NOT NULL,
  longitude   REAL NOT NULL,
  payload     TEXT NOT NULL,
  fetched_at  TEXT NOT NULL
);

-- ----------------------------------------------------------------------------
-- Indexes for the lookups every route actually performs beyond a PK/unique
-- lookup (username is already UNIQUE and thus indexed automatically).
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_legacy_quiz_history_lookup ON legacy_quiz_answer_history(user_id, topic, attempt_number DESC);
CREATE INDEX IF NOT EXISTS idx_bkt_history_lookup ON bkt_answer_history(user_id, skill, attempt_number DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_country_active ON alerts(country, active);

-- Tracks when a country's advisories were last (re)computed, independent of
-- whether that check produced any rows. Without this, an "all clear" result
-- (zero active hazards — a completely valid, common outcome) would look
-- indistinguishable from "never checked", and every single request would
-- re-run both advisory layers instead of respecting the refresh interval.
CREATE TABLE IF NOT EXISTS advisory_refresh_log (
  country     TEXT PRIMARY KEY,
  checked_at  TEXT NOT NULL
);
