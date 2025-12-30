const token = localStorage.getItem('auth_token');
const userRole = localStorage.getItem('user_role'); // Récupéré au login

if (!token) {
    window.location.href = 'login.html';
}

// Fonctions de la Modal
function openModal() { document.getElementById('reviewModal').style.display = 'flex'; }
function closeModal() { document.getElementById('reviewModal').style.display = 'none'; }

// Charger les données [cite: 56, 77]
async function loadDashboard() {
    try {
        const response = await fetch('http://localhost:8000/api/reviews', {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const reviews = await response.json();
        displayReviews(reviews);
        calculateStats(reviews);
    } catch (e) { console.error("Erreur de chargement"); }
}

function displayReviews(reviews) {
    const container = document.getElementById('reviewsList');
    container.innerHTML = reviews.map(r => `
        <div class="review-card ${r.sentiment}">
            <div class="review-header">
                <p>"${r.content}"</p>
                ${userRole === 'admin' ? `<button class="btn-delete" onclick="deleteReview(${r.id})">🗑️</button>` : ''}
            </div>
            <div class="review-meta">
                <span class="review-tag">Score: ${r.score}/100</span>
                <span class="review-tag">Sentiment: ${r.sentiment}</span>
                ${r.topics ? JSON.parse(r.topics).map(t => `<span class="review-tag topic">#${t}</span>`).join('') : ''}
            </div>
        </div>
    `).join('');
}

// Calcul des stats [cite: 77-80]
function calculateStats(reviews) {
    if (reviews.length === 0) return;
    const avg = reviews.reduce((acc, r) => acc + r.score, 0) / reviews.length;
    const pos = (reviews.filter(r => r.sentiment === 'positive').length / reviews.length) * 100;
    
    document.getElementById('avgScore').innerText = `${Math.round(avg)}/100`;
    document.getElementById('posPercent').innerText = `${Math.round(pos)}%`;
    document.getElementById('topTopic').innerText = "Livraison"; // Exemple statique en attendant l'IA thématique
}

// Ajouter un avis [cite: 55, 73]
async function submitReview() {
    const text = document.getElementById('reviewText').value;
    const response = await fetch('http://localhost:8000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: JSON.stringify({ content: text })
    });

    if (response.ok) {
        closeModal();
        document.getElementById('reviewText').value = '';
        loadDashboard();
    }
}

// Supprimer un avis (ADMIN SEULEMENT) [cite: 60]
async function deleteReview(id) {
    if (confirm("Supprimer cet avis ?")) {
        const response = await fetch(`http://localhost:8000/api/reviews/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (response.ok) loadDashboard();
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

loadDashboard();