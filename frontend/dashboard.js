const token = localStorage.getItem('auth_token');

if (!token) {
    window.location.href = 'login.html';
}

// Charger les avis au démarrage [cite: 56]
async function loadDashboard() {
    const response = await fetch('http://localhost:8000/api/reviews', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const reviews = await response.json();
    displayReviews(reviews);
    updateStats(reviews);
}

function displayReviews(reviews) {
    const container = document.getElementById('reviewsList');
    container.innerHTML = reviews.map(r => `
        <div class="review-card ${r.sentiment}">
            <p>"${r.content}"</p>
            <div class="review-meta">
                <span class="review-tag">Score: ${r.score}/100</span>
                <span class="review-tag">Sentiment: ${r.sentiment}</span>
            </div>
        </div>
    `).join('');
}

// Soumission d'un nouvel avis [cite: 55, 73]
async function submitReview() {
    const text = document.getElementById('reviewText').value;
    const response = await fetch('http://localhost:8000/api/reviews', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: text })
    });

    if (response.ok) {
        closeModal();
        loadDashboard(); // Rafraîchir
    }
}

function logout() {
    localStorage.removeItem('auth_token');
    window.location.href = 'login.html';
}

loadDashboard();