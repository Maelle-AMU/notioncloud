require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration de la connexion à la base MySQL
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
};

// Endpoint pour vérifier que l’API est vivante
app.get('/api/healthz', (req, res) => {
    res.json({ ok: true });
});

// Endpoint pour récupérer tous les matchs
app.get('/api/matches', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM `match` ORDER BY match_date ASC');
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Endpoint pour récupérer le classement
app.get("/api/classement", async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            "SELECT * FROM `match` WHERE status='played'"
        );
        await connection.end();

        const classement = {};

        rows.forEach(m => {
            // Initialiser les équipes
            [m.home_team, m.away_team].forEach(team => {
                if (!classement[team]) classement[team] = { points: 0, scored: 0, conceded: 0 };
            });

            // Ajouter les scores
            classement[m.home_team].scored += m.home_score;
            classement[m.home_team].conceded += m.away_score;
            classement[m.away_team].scored += m.away_score;
            classement[m.away_team].conceded += m.home_score;

            // Ajouter les points (victoire = 4, nul = 2, défaite = 0)
            if (m.home_score > m.away_score) {
                classement[m.home_team].points += 4;
            } else if (m.home_score < m.away_score) {
                classement[m.away_team].points += 4;
            } else { // match nul
                classement[m.home_team].points += 2;
                classement[m.away_team].points += 2;
            }
        });

        // Convertir en array et trier par points décroissants puis points marqués
        const classementArray = Object.entries(classement)
            .map(([team, stats]) => ({ team, ...stats }))
            .sort((a, b) => b.points - a.points || b.scored - a.scored);

        res.json(classementArray);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
