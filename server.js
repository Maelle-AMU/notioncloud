require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Reconstruction correcte du certificat (Render remplace souvent \n)
const sslCA = process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replace(/\\n/g, '\n') : null;

console.log('SSL CA loaded:', !!sslCA);

// Pool MySQL (avec parseInt + timeout)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  // n'ajoute ssl que si on a un CA
  ssl: sslCA ? { rejectUnauthorized: true, ca: sslCA } : undefined
});

// Endpoint de test de connexion BDD (log détaillé en cas d'erreur)
app.get('/api/dbtest', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    res.json({ ok: true, msg: 'Connexion BDD réussie' });
  } catch (err) {
    // Log détaillé (ne contient pas de secret)
    console.error('DB test failed:', {
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      message: err.message,
      stack: err.stack ? err.stack.split('\n').slice(0,5).join('\n') : undefined
    });
    // Renvoie plus d'infos côté client (sans secrets)
    res.status(500).json({
      ok: false,
      error: 'Impossible de se connecter à la BDD',
      details: {
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        message: err.message
      }
    });
  }
});

// Routes existantes (matches / classement)
app.get('/api/matches', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM `match` ORDER BY match_date ASC');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/matches error:', err.code, err.message);
    res.status(500).json({ error: 'Erreur serveur', details: { code: err.code, message: err.message } });
  }
});

app.get('/api/classement', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM `match` WHERE status='played'");
    const classement = {};
    rows.forEach(m => {
      [m.home_team, m.away_team].forEach(team => {
        if (!classement[team]) classement[team] = { points: 0, scored: 0, conceded: 0 };
      });
      classement[m.home_team].scored += m.home_score;
      classement[m.home_team].conceded += m.away_score;
      classement[m.away_team].scored += m.away_score;
      classement[m.away_team].conceded += m.home_score;
      if (m.home_score > m.away_score) classement[m.home_team].points += 4;
      else if (m.home_score < m.away_score) classement[m.away_team].points += 4;
      else { classement[m.home_team].points += 2; classement[m.away_team].points += 2; }
    });
    const classementArray = Object.entries(classement)
      .map(([team, stats]) => ({ team, ...stats }))
      .sort((a, b) => b.points - a.points || b.scored - a.scored);
    res.json(classementArray);
  } catch (err) {
    console.error('GET /api/classement error:', err.code, err.message);
    res.status(500).json({ error: 'Erreur serveur', details: { code: err.code, message: err.message } });
  }
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

