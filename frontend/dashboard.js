const token = localStorage.getItem('auth_token');
const userRole = localStorage.getItem('user_role');
const userName = localStorage.getItem('user_name') || 'Utilisateur';

// Vérification de sécurité
if (!token) {
    window.location.href = 'login.html';
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // 1. Afficher le nom
    document.getElementById('userNameDisplay').innerText = userName;
    
    // 2. Afficher le badge de rôle
    const roleBadge = document.getElementById('userRoleBadge');
    if (roleBadge) {
        roleBadge.innerHTML = `<small style="color: #94a3b8">Rôle :</small> <strong style="color: white; text-transform: capitalize;">${userRole}</strong>`;
    }

    // 3. Charger le mode sombre si activé
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }

    // 4. Charger les données
    loadDashboard();
});

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

        if (!response.ok) throw new Error("Erreur serveur");

        const reviews = await response.json();
        
        // Mise à jour du compteur total
        document.getElementById('totalReviewsCount').innerText = `${reviews.length} avis`;

        displayReviews(reviews);
        calculateStats(reviews);
    } catch (e) { 
        console.error("Erreur de chargement", e);
        document.getElementById('reviewsList').innerHTML = `<p style="text-align:center; color:red;">Erreur de connexion au serveur.</p>`;
    }
}

function displayReviews(reviews) {
    const container = document.getElementById('reviewsList');
    if (!container) return;

    if (reviews.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#64748b;">Aucun avis pour le moment.</p>`;
        return;
    }

    // On inverse l'ordre pour avoir les plus récents en haut (si l'API ne le fait pas)
    // reviews.reverse(); 

    container.innerHTML = reviews.map(r => `
        <div class="review-card ${r.sentiment}">
            <div class="review-header">
                <p>"${r.content}"</p>
                ${userRole === 'admin' ? `<button class="btn-delete" onclick="deleteReview(${r.id})">🗑️</button>` : ''}
            </div>
            <div class="review-meta">
                <span class="review-tag">Score: ${r.score}/100</span>
                <span class="review-tag">Sentiment: ${translateSentiment(r.sentiment)}</span>
                ${r.topics ? r.topics.map(t => `<span class="review-tag topic">#${t}</span>`).join('') : ''}
            </div>
        </div>
    `).join('');
}

function translateSentiment(sent) {
    if (sent === 'positive') return 'Positif';
    if (sent === 'negative') return 'Négatif';
    return 'Neutre';
}

// --- CALCUL DES STATISTIQUES ---
function calculateStats(reviews) {
    if (reviews.length === 0) {
        document.getElementById('avgScore').innerText = "--";
        document.getElementById('posPercent').innerText = "--%";
        document.getElementById('topTopic').innerText = "--";
        return;
    }
    
    const avg = reviews.reduce((acc, r) => acc + r.score, 0) / reviews.length;
    const pos = (reviews.filter(r => r.sentiment === 'positive').length / reviews.length) * 100;
    
    document.getElementById('avgScore').innerText = `${Math.round(avg)}/100`;
    document.getElementById('posPercent').innerText = `${Math.round(pos)}%`;
    
    // Détection du thème le plus fréquent
    const allTopics = reviews.flatMap(r => r.topics || []);
    if (allTopics.length > 0) {
        const topTopic = allTopics.sort((a,b) =>
              allTopics.filter(v => v===a).length - allTopics.filter(v => v===b).length
        ).pop();
        document.getElementById('topTopic').innerText = topTopic;
    } else {
        document.getElementById('topTopic').innerText = "Aucun";
    }
}

// --- AJOUTER UN AVIS (CRUCIAL : PREVENT DEFAULT) ---
async function submitReview(event) {
    // 1. EMPÊCHER LE RELOAD
    if(event) event.preventDefault(); 

    const textElement = document.getElementById('reviewText');
    const text = textElement.value;

    if (text.length < 5) {
        alert("L'avis est trop court.");
        return;
    }

    const btnSubmit = event.target.querySelector('button[type="submit"]');
    btnSubmit.innerText = "Analyse en cours...";
    btnSubmit.disabled = true;

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
            await loadDashboard(); // Rafraîchissement dynamique
        } else {
            alert("Erreur lors de l'envoi.");
        }
    } catch (error) {
        console.error("Erreur réseau");
    } finally {
        btnSubmit.innerText = "Lancer l'Analyse IA";
        btnSubmit.disabled = false;
    }
}

// --- SUPPRESSION (ADMIN) ---
async function deleteReview(id) {
    if (confirm("Voulez-vous vraiment supprimer cet avis ?")) {
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

// --- MODE SOMBRE ---
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.setItem('darkMode', 'disabled');
    }
}

// --- DECONNEXION ---
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}