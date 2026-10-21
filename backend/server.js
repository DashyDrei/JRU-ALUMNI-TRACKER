const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const fs = require('node:fs');
const { createHash, createHmac, timingSafeEqual } = require('node:crypto');
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'jru-alumni-admin-token-secret';
const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (curl, mobile apps) and, when no explicit
    // FRONTEND_ORIGIN list is configured, allow any origin.
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS.'));
  }
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Local MySQL connection.
const dbName = process.env.DB_NAME || 'jru_alumni_db';
const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initializeEmptyDatabase(connection) {
  const [tables] = await connection.query('SHOW TABLES');
  if (tables.length > 0) return false;

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const statements = schema
    .split(/;\s*(?:\r?\n|$)/)
    .map(statement => statement.replace(/^--.*$/gm, '').trim())
    .filter(Boolean);

  for (const statement of statements) {
    if (/^(CREATE DATABASE|USE|DROP TABLE)\b/i.test(statement)) continue;
    const safeStatement = statement
      .replace(/^CREATE TABLE\b/i, 'CREATE TABLE IF NOT EXISTS')
      .replace(/^INSERT INTO\b/i, 'INSERT IGNORE INTO');
    await connection.query(safeStatement);
  }

  return true;
}

(async () => {
  let connection;
  try {
    connection = await dbPool.getConnection();
    const initialized = await initializeEmptyDatabase(connection);
    if (initialized) {
      console.log('✅ Initialized empty MySQL database with alumni schema and seed records.');
    }
    console.log(`✅ Connected to MySQL Database: ${dbName}`);
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database:', error.message);
  } finally {
    connection?.release();
  }
})();

const loginAttempts = new Map();

function safeStringEqual(left, right) {
  const leftDigest = createHash('sha256').update(left).digest();
  const rightDigest = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

function createAdminToken() {
  const expiresAt = Math.floor(Date.now() / 1000) + 8 * 60 * 60;
  const signature = createHmac('sha256', ADMIN_TOKEN_SECRET).update(String(expiresAt)).digest('base64url');
  return `${expiresAt}.${signature}`;
}

function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN_SECRET) {
    return res.status(503).json({ error: 'Admin authentication is not configured.' });
  }

  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer (\d+)\.([A-Za-z0-9_-]+)$/);
  if (!match) {
    return res.status(401).json({ error: 'Admin authentication required.' });
  }

  const [, expiresAt, signature] = match;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) {
    return res.status(401).json({ error: 'Admin session expired. Sign in again.' });
  }

  const expected = createHmac('sha256', ADMIN_TOKEN_SECRET).update(expiresAt).digest();
  const provided = Buffer.from(signature, 'base64url');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return res.status(401).json({ error: 'Invalid admin session.' });
  }

  next();
}

app.post('/api/admin/login', (req, res) => {
  if (!ADMIN_PIN || !ADMIN_TOKEN_SECRET) {
    return res.status(503).json({ error: 'Admin authentication is not configured.' });
  }

  const now = Date.now();
  const key = req.ip;
  const attempts = loginAttempts.get(key);
  if (attempts && attempts.resetAt > now && attempts.count >= 5) {
    return res.status(429).json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' });
  }

  if (!safeStringEqual(String(req.body.pin || ''), ADMIN_PIN)) {
    const activeAttempts = attempts && attempts.resetAt > now ? attempts : { count: 0, resetAt: now + 15 * 60 * 1000 };
    activeAttempts.count += 1;
    loginAttempts.set(key, activeAttempts);
    return res.status(401).json({ error: 'Invalid admin passcode.' });
  }

  loginAttempts.delete(key);
  res.json({ token: createAdminToken(), expiresIn: 8 * 60 * 60 });
});

app.get('/api/alumni', async (req, res) => {
  try {
    const { search, collegeKey, program, startYear, endYear, sortBy } = req.query;

    let query = 'SELECT * FROM alumni WHERE 1=1';
    const queryParams = [];

    if (search) {
      query += ` AND (full_name LIKE ? OR student_id LIKE ? OR motto LIKE ? OR program_name LIKE ? OR major LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (collegeKey && collegeKey !== 'ALL') {
      query += ` AND college_key = ?`;
      queryParams.push(collegeKey);
    }

    if (program && program !== 'ALL') {
      query += ` AND (CONCAT(program_name, IF(major IS NOT NULL AND major != '', CONCAT(' - ', major), '')) = ? OR program_name = ?)`;
      queryParams.push(program, program);
    }

    if (startYear && endYear) {
      query += ` AND batch_year BETWEEN ? AND ?`;
      queryParams.push(parseInt(startYear), parseInt(endYear));
    }

    if (sortBy === 'batchAsc') {
      query += ` ORDER BY batch_year ASC, full_name ASC`;
    } else if (sortBy === 'nameAsc') {
      query += ` ORDER BY full_name ASC`;
    } else {
      query += ` ORDER BY batch_year DESC, full_name ASC`;
    }

    const [rows] = await dbPool.execute(query, queryParams);

    const formattedAlumni = rows.map(item => ({
      id: item.id,
      studentId: item.student_id,
      fullName: item.full_name,
      batchYear: item.batch_year,
      collegeKey: item.college_key,
      programName: item.program_name,
      major: item.major,
      motto: item.motto,
      honor: item.honor,
      academicHighlights: item.academic_highlights,
      avatarUrl: item.avatar_url,
      verified: Boolean(item.verified),
      email: item.email,
      linkedin: item.linkedin
    }));

    res.json(formattedAlumni);
  } catch (error) {
    console.error('Error fetching alumni:', error);
    res.status(500).json({ error: 'Failed to retrieve alumni records.' });
  }
});

app.get('/api/alumni/:id', async (req, res) => {
  try {
    const [rows] = await dbPool.execute('SELECT * FROM alumni WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Alumnus profile not found.' });
    }

    const item = rows[0];
    res.json({
      id: item.id,
      studentId: item.student_id,
      fullName: item.full_name,
      batchYear: item.batch_year,
      collegeKey: item.college_key,
      programName: item.program_name,
      major: item.major,
      motto: item.motto,
      honor: item.honor,
      academicHighlights: item.academic_highlights,
      avatarUrl: item.avatar_url,
      verified: Boolean(item.verified),
      email: item.email,
      linkedin: item.linkedin
    });
  } catch (error) {
    console.error('Error fetching alumnus profile:', error);
    res.status(500).json({ error: 'Database server error.' });
  }
});

app.post('/api/alumni', requireAdmin, async (req, res) => {
  try {
    const {
      fullName,
      batchYear,
      studentIdSuffix,
      collegeKey,
      programName,
      major,
      motto,
      honor,
      academicHighlights,
      avatarUrl,
      email,
      linkedin
    } = req.body;

    if (!fullName || !batchYear || !motto) {
      return res.status(400).json({ error: 'Full name, batch year, and motto are required.' });
    }

    const yearPrefix = String(batchYear).slice(-2);
    const suffix = studentIdSuffix || Math.floor(100000 + Math.random() * 900000);
    const formattedStudentId = `${yearPrefix}-${suffix}`;
    const newId = `jru-${batchYear}-${Math.floor(100 + Math.random() * 900)}`;

    const sql = `
      INSERT INTO alumni 
      (id, student_id, full_name, batch_year, college_key, program_name, major, motto, honor, academic_highlights, avatar_url, verified, email, linkedin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `;

    await dbPool.execute(sql, [
      newId,
      formattedStudentId,
      fullName,
      parseInt(batchYear),
      collegeKey,
      programName,
      major || null,
      motto,
      honor || 'Graduate',
      academicHighlights || null,
      avatarUrl || null,
      email || null,
      linkedin || null
    ]);

    res.status(201).json({
      message: 'Alumnus registered successfully!',
      id: newId,
      studentId: formattedStudentId
    });
  } catch (error) {
    console.error('Error creating alumnus record:', error);
    res.status(500).json({ error: 'Failed to insert alumnus into database.' });
  }
});

app.put('/api/alumni/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      batchYear,
      studentIdSuffix,
      collegeKey,
      programName,
      major,
      motto,
      honor,
      academicHighlights,
      avatarUrl,
      email,
      linkedin
    } = req.body;

    if (!fullName || !batchYear || !motto || !collegeKey || !programName) {
      return res.status(400).json({ error: 'Full name, batch year, college, program, and motto are required.' });
    }

    const yearPrefix = String(batchYear).slice(-2);
    const formattedStudentId = `${yearPrefix}-${studentIdSuffix || '192918'}`;

    const sql = `
      UPDATE alumni SET
        full_name = ?,
        batch_year = ?,
        student_id = ?,
        college_key = ?,
        program_name = ?,
        major = ?,
        motto = ?,
        honor = ?,
        academic_highlights = ?,
        avatar_url = ?,
        email = ?,
        linkedin = ?
      WHERE id = ?
    `;

    const [result] = await dbPool.execute(sql, [
      fullName,
      parseInt(batchYear),
      formattedStudentId,
      collegeKey,
      programName,
      major || null,
      motto,
      honor || null,
      academicHighlights || null,
      avatarUrl || null,
      email || null,
      linkedin || null,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found for updating.' });
    }

    res.json({ message: 'Alumnus profile updated successfully.' });
  } catch (error) {
    console.error('Error updating alumnus record:', error);
    res.status(500).json({ error: 'Database update failed.' });
  }
});

app.delete('/api/alumni/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await dbPool.execute('DELETE FROM alumni WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found for deletion.' });
    }

    res.json({ message: 'Alumnus record deleted successfully.' });
  } catch (error) {
    console.error('Error deleting alumnus:', error);
    res.status(500).json({ error: 'Failed to delete alumnus record.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 JRU Alumni API Server running on port ${PORT}`);
});