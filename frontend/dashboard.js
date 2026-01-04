const token = localStorage.getItem('auth_token');
const userRole = localStorage.getItem('user_role'); // Récupéré lors de la connexion

if (!token) {
    window.location.href = 'login.html';
}

// --- GESTION DE LA MODAL ---
function openModal() { 
    document.getElementById('reviewModal').style.display = 'flex'; 
}

function closeModal() { 
    document.getElementById('reviewModal').style.display = 'none'; 
}

// --- CHARGEMENT DES DONNÉES ---
async function loadDashboard() {
    try {
        const response = await fetch('http://localhost:8000/api/reviews', {
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Accept': 'application/json' 
            }
        });
        const reviews = await response.json();
        displayReviews(reviews);
        calculateStats(reviews);
    } catch (e) { 
        console.error("Erreur de chargement des avis"); 
    }
}

function displayReviews(reviews) {
    const container = document.getElementById('reviewsList');
    if (!container) return;

    container.innerHTML = reviews.map(r => `
        <div class="review-card ${r.sentiment}">
            <div class="review-header">
                <p>"${r.content}"</p>
                ${userRole === 'admin' ? `<button class="btn-delete" onclick="deleteReview(${r.id})">🗑️</button>` : ''}
            </div>
            <div class="review-meta">
                <span class="review-tag">Score: ${r.score}/100</span>
                <span class="review-tag">Sentiment: ${r.sentiment}</span>
                ${r.topics ? r.topics.map(t => `<span class="review-tag topic">#${t}</span>`).join('') : ''}
            </div>
        </div>
    `).join('');
}

// --- CALCUL DES STATISTIQUES ---
function calculateStats(reviews) {
    if (reviews.length === 0) return;
    
    const avg = reviews.reduce((acc, r) => acc + r.score, 0) / reviews.length;
    const pos = (reviews.filter(r => r.sentiment === 'positive').length / reviews.length) * 100;
    
    document.getElementById('avgScore').innerText = `${Math.round(avg)}/100`;
    document.getElementById('posPercent').innerText = `${Math.round(pos)}%`;
    
    // Détection du thème le plus fréquent
    const allTopics = reviews.flatMap(r => r.topics || []);
    const topTopic = allTopics.sort((a,b) =>
          allTopics.filter(v => v===a).length - allTopics.filter(v => v===b).length
    ).pop();
    
    document.getElementById('topTopic').innerText = topTopic || "N/A";
}

// --- AJOUTER UN AVIS (CORRIGÉ POUR LA MODAL) ---
async function submitReview(event) {
    if(event) event.preventDefault(); // EMPÊCHE LE RECHARGEMENT DE LA PAGE 🚀

    const textElement = document.getElementById('reviewText');
    const text = textElement.value;

    if (text.length < 10) {
        alert("L'avis doit faire au moins 10 caractères.");
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/api/reviews', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}`, 
                'Accept': 'application/json' 
            },
            body: JSON.stringify({ content: text })
        });

        if (response.ok) {
            closeModal();
            textElement.value = '';
            await loadDashboard(); // Rafraîchit les stats et la liste
        } else {
            alert("Erreur lors de l'envoi de l'avis.");
        }
    } catch (error) {
        console.error("Erreur réseau");
    }
}

// --- SUPPRESSION (ADMIN SEULEMENT) ---
async function deleteReview(id) {
    if (confirm("Supprimer cet avis ?")) {
        const response = await fetch(`http://localhost:8000/api/reviews/${id}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Accept': 'application/json' 
            }
        });
        if (response.ok) loadDashboard();
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// Lancement initial
document.addEventListener('DOMContentLoaded', loadDashboard);