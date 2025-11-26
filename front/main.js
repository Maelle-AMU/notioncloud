// LOCAL: http://localhost:5000
// REMPLACER par l'URL Render après déploiement, ex: https://apiscore-final.onrender.com
const API_BASE = "http://localhost:5000";

async function fetchMatches() {
  const res = await fetch(`${API_BASE}/api/matches`);
  if (!res.ok) throw new Error('Impossible de récupérer les matches');
  return res.json();
}

/* --- Accueil --- */
async function loadHome() {
  try {
    const matches = await fetchMatches();
    const now = new Date();

    const next = matches
      .filter(m => m.status === 'scheduled' && new Date(m.match_date) > now)
      .sort((a,b) => new Date(a.match_date) - new Date(b.match_date))[0];

    const nextDiv = document.querySelector('#next-match .card-body');
    if (next) {
      nextDiv.innerHTML = `<strong>${next.home_team}</strong> vs <strong>${next.away_team}</strong><br>${new Date(next.match_date).toLocaleString()}`;
    } else {
      nextDiv.innerHTML = 'Aucun match à venir';
    }

    const last = matches
      .filter(m => m.status === 'played' && new Date(m.match_date) <= now)
      .sort((a,b) => new Date(b.match_date) - new Date(a.match_date))[0];

    const lastDiv = document.querySelector('#last-result .card-body');
    if (last) {
      lastDiv.innerHTML = `<strong>${last.home_team}</strong> ${last.home_score} - ${last.away_score} <strong>${last.away_team}</strong><br><small>${new Date(last.match_date).toLocaleString()}</small>`;
    } else {
      lastDiv.innerHTML = 'Aucun résultat disponible';
    }
  } catch (err) {
    console.error(err);
    document.querySelectorAll('.card-body').forEach(el => el.innerHTML = 'Erreur de chargement');
  }
}

/* --- Résultats --- */
async function loadResults(filterTeam = '', filterStatus = '') {
  try {
    const matches = await fetchMatches();
    let filtered = matches;

    if (filterStatus) filtered = filtered.filter(m => m.status === filterStatus);
    if (filterTeam) {
      const t = filterTeam.toLowerCase();
      filtered = filtered.filter(m => (m.home_team||'').toLowerCase().includes(t) || (m.away_team||'').toLowerCase().includes(t));
    }

    const tbody = document.querySelector('#matches-table tbody');
    tbody.innerHTML = '';
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">Aucun match</td></tr>';
      return;
    }

    filtered.forEach(m => {
      const score = m.status === 'played' ? `${m.home_score} - ${m.away_score}` : '-';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(m.match_date).toLocaleString()}</td>
        <td>${m.home_team}</td>
        <td>${m.away_team}</td>
        <td>${score}</td>
        <td>${m.status}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    document.querySelector('#matches-table tbody').innerHTML = '<tr><td colspan="5">Erreur de chargement</td></tr>';
  }
}

/* --- Auto-detect page --- */
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('#next-match')) loadHome();
  if (document.querySelector('#matches-table')) {
    loadResults();
    const btn = document.getElementById('btn-filter');
    if (btn) btn.addEventListener('click', () => {
      const team = document.getElementById('filter-team').value.trim();
      const status = document.getElementById('filter-status').value;
      loadResults(team, status);
    });
  }
});
