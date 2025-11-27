require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Préparer le CA SSL si fourni (remplace les \n échappés par de vraies nouvelles lignes)
const rawCa = process.env.DB_SSL_CA || null;
const sslCa = rawCa ? rawCa.replace(/\\n/g, '\n') : null;

// Configuration de la connexion à la base MySQL (pool)
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // n'ajoute la section ssl que si on a un CA
  ssl: sslCa ? { ca: sslCa } : undefined
};

// Log non sensible pour debug
console.log('DB config (non secrets):', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port,
  sslConfigured: !!sslCa
});

const pool = mysql.createPool(dbConfig);

// Endpoint pour vérifier que l’API est vivante
app.get('/api/healthz', (req, res) => {
  res.json({ ok: true });
});

// Endpoint de test de connexion BDD
app.get('/api/dbtest', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    res.json({ ok: true, msg: 'Connexion BDD réussie' });
  } catch (err) {
    console.error('DB test failed:', err.code, err.message);
    res.status(500).json({
      ok: false,
      error: 'Impossible de se connecter à la BDD',
      details: { code: err.code, message: err.message }
    });
  }
});

// Endpoint pour récupérer tous les matchs
app.get('/api/matches', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM `match` ORDER BY match_date ASC');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/matches error:', err.code, err.message);
    res.status(500).json({ error: 'Erreur serveur', details: { code: err.code, message: err.message } });
  }
});

// Endpoint pour récupérer le classement
app.get('/api/classement', async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM `match` WHERE status='played'");
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

// Démarrage du serveur : écouter la variable d'environnement fournie par Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

