<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Services\SentimentAnalysisService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    protected $aiService;

    public function __construct(SentimentAnalysisService $aiService)
    {
        $this->aiService = $aiService;
    }

    // --- PRIORITÉ 1 : Endpoint d'Analyse Isolé (PDF source: 40-48) ---
    // POST /api/analyze
    public function analyze(Request $request)
    {
        $request->validate(['text' => 'required|string|min:5']);
        
        // Appel direct au service IA sans sauver en BDD
        $result = $this->aiService->analyze($request->text);

        return response()->json([
            'sentiment' => $result['sentiment'],
            'score' => $result['score'],
            'topics' => $result['topics']
        ]);
    }

    // --- PRIORITÉ 2 : Statistiques via API (PDF source: 77-80) ---
    // GET /api/stats
    public function stats(Request $request)
    {
        // On calcule les stats sur TOUS les avis de la base (ou filtré par user si besoin)
        $reviews = Review::all(); 
        $total = $reviews->count();

        if ($total === 0) {
            return response()->json([
                'avg_score' => 0,
                'pos_percent' => 0,
                'top_topic' => 'N/A'
            ]);
        }

        $avgScore = $reviews->avg('score');
        $posCount = $reviews->where('sentiment', 'positive')->count();

        // Calcul du Top Thème
        $allTopics = $reviews->pluck('topics')->flatten(); // Aplatit tous les tableaux de topics
        $topTopic = 'Aucun';
        
        if ($allTopics->isNotEmpty()) {
            // Compte les occurrences et prend le plus fréquent
            $topTopic = $allTopics->countBy()->sortDesc()->keys()->first();
        }

        return response()->json([
            'avg_score' => round($avgScore, 1),
            'pos_percent' => round(($posCount / $total) * 100, 1),
            'top_topic' => $topTopic,
            'total_reviews' => $total
        ]);
    }

    // GET /api/reviews
    public function index(Request $request)
    {
        // Retourne les avis du plus récent au plus ancien
        return response()->json(Review::latest()->get());
    }

    // POST /api/reviews
    public function store(Request $request)
    {
        $request->validate(['content' => 'required|string|min:5']);

        $analysis = $this->aiService->analyze($request->content);

        $review = Review::create([
            'user_id' => $request->user()->id, // L'utilisateur connecté
            'content' => $request->content,
            'sentiment' => $analysis['sentiment'],
            'score' => $analysis['score'],
            'topics' => $analysis['topics'],
        ]);

        return response()->json($review, 201);
    }

    // GET /api/reviews/{id} (PDF source: 57)
    public function show($id)
    {
        return response()->json(Review::findOrFail($id));
    }

    // --- PRIORITÉ 3 : Modification (PDF source: 59) ---
    // PUT /api/reviews/{id}
    public function update(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        // Vérification : Seul l'auteur ou l'admin peut modifier
        if ($request->user()->id !== $review->user_id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate(['content' => 'required|string|min:5']);

        // Si on modifie le texte, on relance l'IA !
        $analysis = $this->aiService->analyze($request->content);

        $review->update([
            'content' => $request->content,
            'sentiment' => $analysis['sentiment'],
            'score' => $analysis['score'],
            'topics' => $analysis['topics'],
        ]);

        return response()->json($review);
    }

    // --- CORRECTION DELETE (PDF source: 60) ---
    // DELETE /api/reviews/{id}
    public function destroy(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        // CORRECTION : On vérifie le rôle "admin" OU si c'est le propriétaire
        // Assurez-vous que votre table 'users' a bien une colonne 'role'
        if ($request->user()->role !== 'admin' && $request->user()->id !== $review->user_id) {
            return response()->json(['message' => 'Action réservée aux admins ou au propriétaire'], 403);
        }

        $review->delete();
        return response()->json(['message' => 'Avis supprimé avec succès']);
    }
}
