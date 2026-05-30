// ═══════════════════════════════════════════════════════════════════════════
//  server.js  —  Venoxa API Server
//
//  Handles:
//    POST /api/auth/register
//    POST /api/auth/login
//    GET  /api/user/profile       (JWT required)
//    PUT  /api/user/profile       (JWT required)
//    DELETE /api/user/profile     (JWT required)
//    POST /api/user/sync          (JWT required)
//    POST /api/user/sync-beacon   (token in body)
//
//  Start: node server.js
//  Requires: npm install express pg bcrypt jsonwebtoken cors dotenv
// ═══════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const { Pool } = pg;

// ─────────────────────────────────────────────────────────────────────────────
//  Config
// ─────────────────────────────────────────────────────────────────────────────
const PORT       = process.env.PORT       || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'VENOXA-2025';
const DB_URL     = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('[server] ✗ DATABASE_URL is not set in .env');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Database pool
// ─────────────────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => console.error('[DB] Unexpected error on idle client:', err));

// Test connection on startup
pool.connect()
  .then(client => { console.log('[DB] Connected ✓'); client.release(); })
  .catch(err => console.error('[DB] Connection failed:', err.message));

// ─────────────────────────────────────────────────────────────────────────────
//  App
// ─────────────────────────────────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ─────────────────────────────────────────────────────────────────────────────
//  JWT middleware
// ─────────────────────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.uid = payload.uid;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Merge helpers
//    • Numbers  → Math.max(local, remote)
//    • Arrays   → longer one wins (more data preserved)
//    • Objects  → deep merge, numeric leaf = max, string leaf = local wins if non-empty
// ─────────────────────────────────────────────────────────────────────────────
function mergeVal(local, remote) {
  if (local === undefined || local === null) return remote;
  if (remote === undefined || remote === null) return local;

  if (typeof local === 'number' && typeof remote === 'number') {
    return Math.max(local, remote);
  }

  if (Array.isArray(local) && Array.isArray(remote)) {
    return local.length >= remote.length ? local : remote;
  }

  if (
    typeof local  === 'object' && !Array.isArray(local) &&
    typeof remote === 'object' && !Array.isArray(remote)
  ) {
    const merged = { ...remote };
    for (const [k, v] of Object.entries(local)) {
      merged[k] = mergeVal(v, remote[k]);
    }
    return merged;
  }

  // Strings / booleans: local wins if non-empty
  return (local !== undefined && local !== '') ? local : remote;
}

function mergeObj(local = {}, remote = {}) {
  const merged = { ...remote };
  for (const [k, v] of Object.entries(local)) {
    merged[k] = mergeVal(v, remote[k]);
  }
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Read all user data from the 5 tables → flat JS object
// ─────────────────────────────────────────────────────────────────────────────
async function readUserData(uid) {
  const [profileRes, vocabRes, progressRes, historyRes, srsRes] = await Promise.all([
    pool.query('SELECT * FROM users WHERE id = $1', [uid]),
    pool.query('SELECT * FROM user_vocab WHERE user_id = $1', [uid]),
    pool.query('SELECT * FROM user_progress WHERE user_id = $1', [uid]),
    pool.query('SELECT * FROM user_history WHERE user_id = $1', [uid]),
    pool.query('SELECT * FROM user_srs WHERE user_id = $1', [uid]),
  ]);

  const p  = profileRes.rows[0]  || {};
  const v  = vocabRes.rows[0]    || {};
  const pr = progressRes.rows[0] || {};
  const h  = historyRes.rows[0]  || {};
  const s  = srsRes.rows[0]      || {};

  return {
    id:               p.id              || uid,
    email:            p.email           || '',
    username:         p.username        || '',
    avatar:           p.avatar          || '',
    dob:              p.dob             || '',
    gender:           p.gender          || '',
    languages:        p.languages       || [],
    level:            p.level           || 'B2',
    streak:           p.streak          || 0,
    xp:               p.xp              || 0,
    achievements:     p.achievements    || [],
    // Vocab
    globalVocab:      v.global_vocab       || [],
    phrasalVocab:     v.phrasal_vocab      || [],
    idiomsVocab:      v.idioms_vocab       || [],
    idiomsProperVocab:v.idioms_proper_vocab || [],
    langeekVocab:     v.langeek_vocab      || [],
    // Progress
    completedCells:   pr.completed_cells  || {},
    usageTime:        pr.usage_time        || {},
    calendarDays:     pr.calendar_days     || [],
    planConfig:       pr.plan_config       || {},
    studiedWords:     pr.studied_words     || [],
    // History
    speakingHistory:  h.speaking_history || [],
    writingHistory:   h.writing_history  || [],
    // SRS
    srsData:          s.srs_data           || {},
    langeekSrsData:   s.langeek_srs_data   || {},
    phrasalSrs:       s.phrasal_srs        || {},
    idiomsSrs:        s.idioms_srs         || {},
    idiomsProperSrs:  s.idioms_proper_srs  || {},
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Write merged data to all 5 tables in parallel
// ─────────────────────────────────────────────────────────────────────────────
async function writeUserData(uid, d) {
  const now = new Date().toISOString();

  await Promise.all([
    // Profile (partial update — don't overwrite email/username/etc here)
    pool.query(`
      UPDATE users
      SET xp = $2, streak = $3, level = $4, avatar = $5,
          achievements = $6, updated_at = $7
      WHERE id = $1`,
      [uid, d.xp, d.streak, d.level, d.avatar, JSON.stringify(d.achievements), now]
    ),

    // Vocab (upsert)
    pool.query(`
      INSERT INTO user_vocab (user_id, global_vocab, phrasal_vocab, idioms_vocab, idioms_proper_vocab, langeek_vocab)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (user_id) DO UPDATE SET
        global_vocab        = EXCLUDED.global_vocab,
        phrasal_vocab       = EXCLUDED.phrasal_vocab,
        idioms_vocab        = EXCLUDED.idioms_vocab,
        idioms_proper_vocab = EXCLUDED.idioms_proper_vocab,
        langeek_vocab       = EXCLUDED.langeek_vocab`,
      [uid,
        JSON.stringify(d.globalVocab),
        JSON.stringify(d.phrasalVocab),
        JSON.stringify(d.idiomsVocab),
        JSON.stringify(d.idiomsProperVocab),
        JSON.stringify(d.langeekVocab)]
    ),

    // Progress (upsert)
    pool.query(`
      INSERT INTO user_progress (user_id, completed_cells, usage_time, calendar_days, plan_config, studied_words)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (user_id) DO UPDATE SET
        completed_cells = EXCLUDED.completed_cells,
        usage_time      = EXCLUDED.usage_time,
        calendar_days   = EXCLUDED.calendar_days,
        plan_config     = EXCLUDED.plan_config,
        studied_words   = EXCLUDED.studied_words`,
      [uid,
        JSON.stringify(d.completedCells),
        JSON.stringify(d.usageTime),
        JSON.stringify(d.calendarDays),
        JSON.stringify(d.planConfig),
        JSON.stringify(d.studiedWords)]
    ),

    // History (upsert)
    pool.query(`
      INSERT INTO user_history (user_id, speaking_history, writing_history)
      VALUES ($1,$2,$3)
      ON CONFLICT (user_id) DO UPDATE SET
        speaking_history = EXCLUDED.speaking_history,
        writing_history  = EXCLUDED.writing_history`,
      [uid,
        JSON.stringify(d.speakingHistory),
        JSON.stringify(d.writingHistory)]
    ),

    // SRS (upsert)
    pool.query(`
      INSERT INTO user_srs (user_id, srs_data, langeek_srs_data, phrasal_srs, idioms_srs, idioms_proper_srs)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (user_id) DO UPDATE SET
        srs_data          = EXCLUDED.srs_data,
        langeek_srs_data  = EXCLUDED.langeek_srs_data,
        phrasal_srs       = EXCLUDED.phrasal_srs,
        idioms_srs        = EXCLUDED.idioms_srs,
        idioms_proper_srs = EXCLUDED.idioms_proper_srs`,
      [uid,
        JSON.stringify(d.srsData),
        JSON.stringify(d.langeekSrsData),
        JSON.stringify(d.phrasalSrs),
        JSON.stringify(d.idiomsSrs),
        JSON.stringify(d.idiomsProperSrs)]
    ),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { email, password, username, dob = '', gender = '', languages = [] } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'email, password, and username are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'This email is already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const now  = new Date().toISOString();

    const result = await pool.query(`
      INSERT INTO users (email, password_hash, username, dob, gender, languages, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, username, avatar, dob, gender, languages, level, streak, xp, achievements`,
      [email, hash, username, dob, gender, JSON.stringify(languages), now, now]
    );

    const user = result.rows[0];

    // Seed empty sub-table rows
    await Promise.allSettled([
      pool.query('INSERT INTO user_vocab    (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]),
      pool.query('INSERT INTO user_progress (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]),
      pool.query('INSERT INTO user_history  (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]),
      pool.query('INSERT INTO user_srs      (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]),
    ]);

    const token = jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: '90d' });
    return res.status(201).json({ token, user });

  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );

    const row = result.rows[0];
    if (!row) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, row.password_hash || '');
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ uid: row.id }, JWT_SECRET, { expiresIn: '90d' });

    // Return full user data
    const userData = await readUserData(row.id);
    return res.json({ token, user: userData });

  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/user/profile
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const data = await readUserData(req.uid);
    return res.json(data);
  } catch (err) {
    console.error('[profile GET]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  PUT /api/user/profile
// ─────────────────────────────────────────────────────────────────────────────
app.put('/api/user/profile', requireAuth, async (req, res) => {
  const { username, email, avatar, dob, gender, languages, level } = req.body;
  const updates = [];
  const values  = [];
  let   idx     = 1;

  const addField = (col, val) => {
    if (val !== undefined) {
      updates.push(`${col} = $${idx++}`);
      values.push(typeof val === 'object' ? JSON.stringify(val) : val);
    }
  };

  addField('username', username);
  addField('email',    email);
  addField('avatar',   avatar);
  addField('dob',      dob);
  addField('gender',   gender);
  addField('languages', languages);
  addField('level',    level);

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  updates.push(`updated_at = $${idx++}`);
  values.push(new Date().toISOString());
  values.push(req.uid);

  try {
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );
    const data = await readUserData(req.uid);
    return res.json(data);
  } catch (err) {
    console.error('[profile PUT]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /api/user/profile
// ─────────────────────────────────────────────────────────────────────────────
app.delete('/api/user/profile', requireAuth, async (req, res) => {
  try {
    // ON DELETE CASCADE handles sub-tables
    await pool.query('DELETE FROM users WHERE id = $1', [req.uid]);
    return res.json({ success: true });
  } catch (err) {
    console.error('[profile DELETE]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  Shared sync logic (used by both /sync and /sync-beacon)
// ─────────────────────────────────────────────────────────────────────────────
async function doSync(uid, local) {
  // 1. Read remote
  const remote = await readUserData(uid);

  // 2. Merge each bucket
  const merged = {
    id:    remote.id,
    email: remote.email,

    // Profile scalars
    username:     remote.username || local.username || '',
    avatar:       local.avatar    || remote.avatar  || '',
    dob:          remote.dob      || local.dob      || '',
    gender:       remote.gender   || local.gender   || '',
    languages:    remote.languages.length >= (local.languages || []).length
                    ? remote.languages : (local.languages || []),

    xp:           mergeVal(local.xp,     remote.xp)     || 0,
    streak:       mergeVal(local.streak, remote.streak)  || 0,
    level:        local.level    || remote.level         || 'B2',
    achievements: (local.achievements || []).length >= remote.achievements.length
                    ? (local.achievements || []) : remote.achievements,

    // Vocab
    globalVocab:       mergeVal(local.globalVocab,       remote.globalVocab),
    phrasalVocab:      mergeVal(local.phrasalVocab,      remote.phrasalVocab),
    idiomsVocab:       mergeVal(local.idiomsVocab,       remote.idiomsVocab),
    idiomsProperVocab: mergeVal(local.idiomsProperVocab, remote.idiomsProperVocab),
    langeekVocab:      mergeVal(local.langeekVocab,      remote.langeekVocab),

    // Progress
    completedCells: mergeObj(local.completedCells, remote.completedCells),
    usageTime:      mergeObj(local.usageTime,      remote.usageTime),
    calendarDays:   mergeVal(local.calendarDays,   remote.calendarDays),
    planConfig:     mergeObj(local.planConfig,     remote.planConfig),
    studiedWords:   mergeVal(local.studiedWords,   remote.studiedWords),

    // History
    speakingHistory: mergeVal(local.speakingHistory, remote.speakingHistory),
    writingHistory:  mergeVal(local.writingHistory,  remote.writingHistory),

    // SRS
    srsData:          mergeObj(local.srsData,         remote.srsData),
    langeekSrsData:   mergeObj(local.langeekSrsData,  remote.langeekSrsData),
    phrasalSrs:       mergeObj(local.phrasalSrs,      remote.phrasalSrs),
    idiomsSrs:        mergeObj(local.idiomsSrs,       remote.idiomsSrs),
    idiomsProperSrs:  mergeObj(local.idiomsProperSrs, remote.idiomsProperSrs),
  };

  // 3. Persist
  await writeUserData(uid, merged);

  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/user/sync
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/user/sync', requireAuth, async (req, res) => {
  try {
    const merged = await doSync(req.uid, req.body);
    console.log(`[sync] uid=${req.uid} ✓`);
    return res.json(merged);
  } catch (err) {
    console.error('[sync]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/user/sync-beacon  (token in body — from navigator.sendBeacon)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/user/sync-beacon', async (req, res) => {
  const { token, ...payload } = req.body;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await doSync(decoded.uid, payload);
    return res.status(204).end();
  } catch (err) {
    console.error('[sync-beacon]', err);
    return res.status(err.name === 'JsonWebTokenError' ? 401 : 500)
              .json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  Health check
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// ─────────────────────────────────────────────────────────────────────────────
//  Start
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] Venoxa API running on http://localhost:${PORT}`);
});
