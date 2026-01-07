// =========================================================
// 1. VARIABLES GLOBALES & SÉCURITÉ
// =========================================================
const token = localStorage.getItem('auth_token');
const userRole = localStorage.getItem('user_role');
const userName = localStorage.getItem('user_name') || 'Utilisateur';

// Redirection immédiate si pas connecté
if (!token) {
    window.location.href = 'login.html';
}

// =========================================================
// 2. INITIALISATION AU CHARGEMENT
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    // A. Afficher le nom
    const nameDisplay = document.getElementById('userNameDisplay');
    if (nameDisplay) nameDisplay.innerText = userName;
    
    // B. Afficher le rôle
    const roleBadge = document.getElementById('userRoleBadge');
    if (roleBadge) {
        roleBadge.innerHTML = `<small style="color: #94a3b8">Rôle :</small> <strong style="color: white; text-transform: capitalize;">${userRole}</strong>`;
    }

    // C. Mode sombre
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }

    // D. Charger les données
    loadDashboard();
});

// =========================================================
// 3. GESTION MODAL
// =========================================================
function openModal() { 
    document.getElementById('reviewModal').style.display = 'flex'; 
}

function closeModal() { 
    document.getElementById('reviewModal').style.display = 'none'; 
}

// =========================================================
// 4. CHARGEMENT DES DONNÉES
// =========================================================
async function loadDashboard() {
    console.log("Chargement du dashboard...");
    try {
        const response = await fetch('http://localhost:8000/api/reviews', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Accept': 'application/json' 
            }
        });

        if (!response.ok) throw new Error("Erreur serveur lors du chargement");

        let reviews = await response.json();
        // Inverser pour avoir les plus récents en haut
        reviews = reviews.reverse(); 

        document.getElementById('totalReviewsCount').innerText = `${reviews.length} avis`;
        displayReviews(reviews);
        calculateStats(reviews);

    } catch (e) { 
        console.error("Erreur Load:", e);
        document.getElementById('reviewsList').innerHTML = `<p style="text-align:center; color:#ef4444;">Erreur de connexion au serveur.</p>`;
    }
}

// =========================================================
// 5. AFFICHAGE DES AVIS
// =========================================================
function displayReviews(reviews) {
    const container = document.getElementById('reviewsList');
    if (!container) return;

    if (reviews.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#64748b; margin-top:2rem;">Aucun avis pour le moment.</p>`;
        return;
    }

    container.innerHTML = reviews.map(r => `
        <div class="review-card ${r.sentiment}">
            <div class="review-header">
                <p>"${r.content}"</p>
                ${userRole === 'admin' ? `<button class="btn-delete" onclick="deleteReview(${r.id})">🗑️</button>` : ''}
            </div>
            <div class="review-meta">
                <span class="review-tag">Score: ${r.score}/100</span>
                <span class="review-tag">Sentiment: ${translateSentiment(r.sentiment)}</span>
                ${parseTopics(r.topics)}
            </div>
        </div>
    `).join('');
}

function translateSentiment(sent) {
    if (sent === 'positive') return 'Positif';
    if (sent === 'negative') return 'Négatif';
    return 'Neutre';
}

function parseTopics(topics) {
    let topicArray = Array.isArray(topics) ? topics : JSON.parse(topics || '[]');
    return topicArray.map(t => `<span class="review-tag topic">#${t}</span>`).join('');
}

// =========================================================
// 6. CALCUL DES STATISTIQUES
// =========================================================
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
    
    const allTopics = reviews.flatMap(r => (Array.isArray(r.topics) ? r.topics : []));
    if (allTopics.length > 0) {
        const topicCounts = {};
        allTopics.forEach(t => { topicCounts[t] = (topicCounts[t] || 0) + 1; });
        const topTopic = Object.keys(topicCounts).reduce((a, b) => topicCounts[a] > topicCounts[b] ? a : b);
        document.getElementById('topTopic').innerText = topTopic;
    } else {
        document.getElementById('topTopic').innerText = "N/A";
    }
}

// =========================================================
// 7. AJOUT D'UN AVIS (FONCTION CORRIGÉE SANS EVENT)
// =========================================================
async function submitReview() {
    console.log("Clic sur Ajouter !");
    
    const textElement = document.getElementById('reviewText');
    const text = textElement.value;
    const btnSubmit = document.getElementById('btnSubmitReview');

    if (!text || text.length < 5) {
        alert("L'avis est trop court (min 5 caractères).");
        return;
    }

    // Désactivation du bouton pour éviter le double-clic
    if(btnSubmit) {
        btnSubmit.innerText = "Analyse en cours...";
        btnSubmit.disabled = true;
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
            console.log("Avis ajouté avec succès");
            closeModal();
            textElement.value = '';
            await loadDashboard(); 
        } else {
            alert("Erreur serveur lors de l'ajout.");
        }
    } catch (error) {
        console.error("Erreur réseau :", error);
        alert("Impossible de contacter le serveur.");
    } finally {
        // Réactiver le bouton
        if(btnSubmit) {
            btnSubmit.innerText = "Lancer l'Analyse IA";
            btnSubmit.disabled = false;
        }
    }
}

// =========================================================
// 8. AUTRES FONCTIONS
// =========================================================
async function deleteReview(id) {
    if (confirm("Supprimer cet avis ?")) {
        try {
            await fetch(`http://localhost:8000/api/reviews/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'Accept': 'application/json' 
                }
            });
            loadDashboard();
        } catch (e) {
            console.error(e);
        }
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled');
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}