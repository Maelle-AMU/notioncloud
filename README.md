# NotionCloud - ScoreCenter Elite 1 Féminine

Mini projet : API Node.js / Express + MySQL (Aiven avec DBeaver) + front statique (Render) 
Objectif : afficher les résultats du championnat Elite 1 Féminine via une API simple.


## Endpoints
- GET /api/healthz  → { "ok": true }
- GET /api/matches  → liste JSON des matchs

## Front
- `scorefront/index.html` → accueil (prochain match / dernier résultat)
- `scorefront/resultats.html` → tableau des matchs


## Fonctionnalités

Base MySQL distante (Aiven)

API Node/Express (Render) exposant :

GET /api/healthz → vérifier que l’API est vivante

GET /api/matches → récupération des matchs

Front statique HTML/CSS/JS (sur Render) :

/ → accueil (prochain match / dernier résultat)

/resultats → liste complète des rencontres

1. Installation & exécution locale
Les Prérequis sont : Node.js 18+ , MySQL accessible (Aiven) et 
npm

Vous devez installer des dépendances : npm install

Puis lancer l’API : npm start (ou dans Windows Powershell : node server.js)

Par défaut, l’API démarre sur :
http://localhost:3000

2. Variables d’environnement

Les variables d'environnement prennent la forme suivante 
(il n'est pas possible de les insérer ici car Github bloquera l'import
)
DB_HOST=xxx.aivencloud.com
DB_PORT=xxxxx
DB_USER=xxxx
DB_PASSWORD=xxxx
DB_DATABASE=xxxx

3. Endpoints API
Pour vérifier que l'API fonctionne :
GET /api/healthz

Réponse :

{ "ok": true }

Pour retourner la liste des matchs depuis la base MySQL : 
GET /api/matches


Exemple :

[
  {
    "id": 1,
    "match_date": "2025-03-01 18:00:00",
    "home_team": "Stade Bordelais",
    "away_team": "RC Toulon",
    "home_score": 24,
    "away_score": 18,
    "status": "played",
    "notes": null
  }
]


Cela concerne de la lecture seule uniquement : les données sont modifiés directement via DBeaver

4. Modèle SQL (table match)

Voici la structure utilisée dans Aiven :

Colonne	Type	Description

match_date	DATETIME	Date/heure du match
home_team	VARCHAR	Équipe à domicile
away_team	VARCHAR	Équipe extérieure
home_score	INT (NULL)	Score domicile
away_score	INT (NULL)	Score extérieur
status	VARCHAR	scheduled / played / canceled
notes	VARCHAR 	Commentaires optionnels
id	INT PK AI	Identifiant unique

5. Front statique

Deux codes sont utilisés : 
- index.html

Pour la présentation, le prochain match et le dernier résultat
Requêtes API via fetch

- resultats.html

Pour afficher le tableau complet des rencontres via GET /api/matches

6. Déploiement (Render)
Build Command :
npm install

Start Command :
npm start

Variables d’environnement à ajouter dans Render :

DB_HOST

DB_PORT

DB_USER

DB_PASSWORD

DB_DATABASE

📎 7. Liens à fournir (à compléter)

URL API :
https://votre-api.onrender.com

Endpoints :
https://votre-api.onrender.com/api/healthz

https://votre-api.onrender.com/api/matches

Front :
https://votre-front.onrender.com

/

/resultats