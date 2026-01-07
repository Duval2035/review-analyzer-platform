<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Services\SentimentAnalysisService;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    protected $aiService;

    // Injection automatique du service
    public function __construct(SentimentAnalysisService $aiService)
    {
        $this->aiService = $aiService;
    }

    // 1. Lister les avis
    public function index(Request $request)
    {
        $reviews = Review::where('user_id', $request->user()->id)
                         ->latest()
                         ->get();
        return response()->json($reviews);
    }

    // 2. Ajouter un avis + Analyse IA
    public function store(Request $request)
    {
        $request->validate([
            'content' => 'required|string|min:5',
        ]);

        // Appel à la VRAIE IA Google Gemini
        $analysis = $this->aiService->analyze($request->content);

        // Création en base de données
        $review = Review::create([
            'user_id' => $request->user()->id,
            'content' => $request->content,
            'sentiment' => $analysis['sentiment'],
            'score' => $analysis['score'],
            'topics' => $analysis['topics'], // Le modèle gère la conversion array
        ]);

        return response()->json($review, 201);
    }

    // 3. Supprimer un avis
    public function destroy($id)
    {
        $review = Review::findOrFail($id);
        $review->delete();
        return response()->json(['message' => 'Supprimé']);
    }
}