require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Reconstruction correcte du certificat (Render remplace souvent \n)
const sslCA = process.env.DB_SSL_CA
  ? process.env.DB_SSL_CA.replace(/\\n/g, '\n')
  : null;

console.log("SSL CA loaded:", !!sslCA); // DEBUG

// Pool MySQL (important pour Render)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: true,
    ca: sslCA
  }
});

// Test DB
app.get('/api/dbtest', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Matches
app.get('/api/matches', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM `match` ORDER BY match_date ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Classement
app.get("/api/classement", async (req, res) => {
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

      if (m.home_score > m.away_score) {
        classement[m.home_team].points += 4;
      } else if (m.home_score < m.away_score) {
        classement[m.away_team].points += 4;
      } else {
        classement[m.home_team].points += 2;
        classement[m.away_team].points += 2;
      }
    });

    const classementArray = Object.entries(classement)
      .map(([team, stats]) => ({ team, ...stats }))
      .sort((a, b) => b.points - a.points || b.scored - a.scored);

    res.json(classementArray);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

