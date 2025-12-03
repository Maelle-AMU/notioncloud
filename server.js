// On "importe" les outils qu'on a installés pour pouvoir les utiliser

require('dotenv').config(); // Charge les variables du fichier .env

const express = require('express');

const mysql = require('mysql2');

const cors = require('cors');

// On crée l'application (le serveur)

const app = express();

// On configure CORS pour accepter les requêtes venant d'ailleurs (du front)

app.use(cors());

// --- CONFIGURATION DE LA BASE DE DONNÉES ---

// On récupère les infos de connexion depuis les variables d'environnement (le fichier .env)

// C'est sécurisé : le mot de passe n'est pas écrit ici !

const connection = mysql.createConnection({

  host: process.env.DB_HOST,

  port: process.env.DB_PORT,

  user: process.env.DB_USER,

  password: process.env.DB_PASSWORD,

  database: process.env.DB_NAME

});

// On teste la connexion au démarrage

connection.connect((err) => {

  if (err) {

    console.error('Erreur de connexion à la base de données :', err);

  } else {

    console.log('Connecté à la base de données MySQL sur Aiven !');

  }

});
console.log('DB_HOST =', process.env.DB_HOST);
console.log('DB_PORT =', process.env.DB_PORT);
console.log('DB_USER =', process.env.DB_USER);

// --- LES ROUTES DE L'API (Les URLs disponibles) ---

// 1. Route de santé (Health Check)

// Permet de vérifier que l'API est en vie.

// Quand on appellera GET /api/healthz, ça répondra { "ok": true }

app.get('/api/healthz', (req, res) => {

  res.json({ ok: true });

});

// 2. Route pour récupérer les matchs

// Quand on appellera GET /api/matches, on demandera la liste à la base de données

app.get('/api/matches', (req, res) => {

  // On écrit la requête SQL simple

  const query = 'SELECT * FROM `match` ORDER BY match_date ASC';

  // On l'exécute sur la connexion

  connection.query(query, (err, results) => {

    if (err) {

      // S'il y a une erreur technique (ex: table inexistante), on renvoie une erreur 500

      console.error(err);

      res.status(500).json({ error: 'Erreur lors de la récupération des matchs' });

    } else {

      // Sinon, on renvoie les résultats en format JSON (texte structuré)

      res.json(results);

    }

  });

});








// --- DÉMARRAGE DU SERVEUR ---

// On dit à l'application d'écouter sur le port défini (souvent 3000 en local, ou défini par Render en ligne)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(`Le serveur API est lancé !`);

  console.log(`Testez le ici : http://localhost:${PORT}/api/healthz`);

});