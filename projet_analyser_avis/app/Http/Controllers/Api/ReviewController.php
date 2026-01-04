<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Services\SentimentAnalysisService; // Assurez-vous que ce service existe
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    protected $aiService;

    public function __construct(SentimentAnalysisService $aiService)
    {
        $this->aiService = $aiService;
    }

    // GET /api/reviews : Liste tous les avis
    public function index()
    {
        return response()->json(Review::with('user')->latest()->get());
    }

    // POST /api/reviews : Création + Analyse IA automatique
    public function store(Request $request)
    {
        $request->validate([
            'content' => 'required|string|min:10',
        ]);

        // Appel automatique du service IA (Membre 3)
        $analysis = $this->aiService->analyze($request->content);

        $review = Review::create([
            'user_id' => Auth::id(),
            'content' => $request->content,
            'sentiment' => $analysis['sentiment'],
            'score' => $analysis['score'],
            'topics' => json_encode($analysis['topics']), // Stockage en JSON
        ]);

        return response()->json($review, 201);
    }

    // GET /api/reviews/{id} : Détails d'un avis
    public function show($id)
    {
        $review = Review::findOrFail($id);
        return response()->json($review);
    }

    // DELETE /api/reviews/{id} : Suppression (Réservé Admin via middleware ou check)
    public function destroy($id)
    {
        $review = Review::findOrFail($id);
        
        // Sécurité supplémentaire : vérification du rôle admin
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Action non autorisée'], 403);
        }

        $review->delete();
        return response()->json(['message' => 'Avis supprimé avec succès']);
    }

    // GET /api/stats : Statistiques pour le Dashboard
    public function stats()
    {
        $total = Review::count();
        if ($total === 0) {
            return response()->json([
                'avg_score' => 0,
                'pos_percent' => 0,
                'top_topic' => 'N/A'
            ]);
        }

        $avgScore = Review::avg('score');
        $posCount = Review::where('sentiment', 'positive')->count();

        return response()->json([
            'avg_score' => round($avgScore, 1),
            'pos_percent' => round(($posCount / $total) * 100, 1),
            'total_reviews' => $total
        ]);
    }
}