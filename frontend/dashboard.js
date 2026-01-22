const token = localStorage.getItem('auth_token');
const userRole = localStorage.getItem('user_role');
const userName = localStorage.getItem('user_name') || 'Utilisateur';

if (!token) window.location.href = 'login.html';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('userNameDisplay').innerText = userName;
    if(document.getElementById('userRoleBadge')) {
        document.getElementById('userRoleBadge').innerHTML = `<small style="color:#94a3b8">Rôle:</small> <strong>${userRole}</strong>`;
    }
    loadDashboard();
});

function openModal() { document.getElementById('reviewModal').style.display = 'flex'; }
function closeModal() { document.getElementById('reviewModal').style.display = 'none'; }

async function loadDashboard() {
    try {
        // 1. Récupérer les AVIS
        const resReviews = await fetch('http://127.0.0.1:8000/api/reviews', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const reviews = await resReviews.json();
        
        // 2. Récupérer les STATS
        const resStats = await fetch('http://127.0.0.1:8000/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await resStats.json();

        // Affichage
        document.getElementById('totalReviewsCount').innerText = `${stats.total_reviews || 0} avis`;
        document.getElementById('avgScore').innerText = `${stats.avg_score || 0}/100`;
        document.getElementById('posPercent').innerText = `${stats.pos_percent || 0}%`;
        document.getElementById('topTopic').innerText = stats.top_topic || '--';

        displayReviews(reviews);
    } catch (e) {
        console.error("Erreur chargement:", e);
    }
}

function displayReviews(reviews) {
    const container = document.getElementById('reviewsList');
    
    const currentUserId = parseInt(localStorage.getItem('user_id') || 0);
    const currentUserRole = localStorage.getItem('user_role'); 

    if (!reviews.length) {
        container.innerHTML = `<p style="text-align:center; color:#64748b;">Aucun avis.</p>`;
        return;
    }

    container.innerHTML = reviews.map(r => {
 
        let deleteButton = '';
        
        if (currentUserRole === 'admin' || r.user_id === currentUserId) {
            deleteButton = `<button class="btn-delete" onclick="deleteReview(${r.id})" style="border:none;background:none;cursor:pointer;" title="Supprimer">🗑️</button>`;
        }

        return `
        <div class="review-card ${r.sentiment || 'neutral'}">
            <div class="review-header">
                <p>"${r.content}"</p>
                ${deleteButton}
            </div>
            <div class="review-meta">
                <span class="review-tag">Score: ${r.score}</span>
                <span class="review-tag">Topic: ${parseTopics(r.topics)}</span>
                <small style="color:#aaa; font-size:0.8em; margin-left:auto">Par user #${r.user_id}</small>
            </div>
        </div>
        `;
    }).join('');
}
function parseTopics(t) {
    return (Array.isArray(t) ? t : JSON.parse(t || '[]')).map(x => `#${x}`).join(' ');
}

async function submitReview() {
    const text = document.getElementById('reviewText').value;
    if (!text) return alert("Texte vide");

    const btn = document.querySelector('.modal-actions .btn-primary');
    btn.innerText = "Analyse...";
    btn.disabled = true;

    try {
        const res = await fetch('http://127.0.0.1:8000/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ content: text })
        });
        if (res.ok) {
            closeModal();
            document.getElementById('reviewText').value = '';
            loadDashboard();
        } else {
            alert("Erreur serveur");
        }
    } catch (e) {
        alert("Erreur connexion");
    } finally {
        btn.innerText = "Lancer l'Analyse IA";
        btn.disabled = false;
    }
}

async function deleteReview(id) {
    if (!confirm("Supprimer ?")) return;
    await fetch(`http://127.0.0.1:8000/api/reviews/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    loadDashboard();
}

function logout() { localStorage.clear(); window.location.href = 'login.html'; }
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); }