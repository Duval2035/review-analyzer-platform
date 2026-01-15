<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Services\SentimentAnalysisService;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    protected $aiService;

    public function __construct(SentimentAnalysisService $aiService)
    {
        $this->aiService = $aiService;
    }

    // PRIORITÉ 1 : Endpoint IA isolé (Demandé par le PDF)
    public function analyze(Request $request)
    {
        $request->validate(['text' => 'required|string|min:5']);
        return response()->json($this->aiService->analyze($request->text));
    }

    // PRIORITÉ 2 : Stats calculées par le Backend (Demandé par le PDF)
    public function stats()
    {
        $reviews = Review::all();
        $total = $reviews->count();

        if ($total === 0) {
            return response()->json(['avg_score' => 0, 'pos_percent' => 0, 'top_topic' => 'Aucun', 'total_reviews' => 0]);
        }

        $avgScore = $reviews->avg('score');
        $posCount = $reviews->where('sentiment', 'positive')->count();
        
        // Calcul du top thème
        $allTopics = $reviews->pluck('topics')->flatten();
        $topTopic = $allTopics->isEmpty() ? 'Aucun' : $allTopics->countBy()->sortDesc()->keys()->first();

        return response()->json([
            'avg_score' => round($avgScore),
            'pos_percent' => round(($posCount / $total) * 100),
            'top_topic' => $topTopic,
            'total_reviews' => $total
        ]);
    }

    public function index()
    {
        return response()->json(Review::latest()->get());
    }

    public function store(Request $request)
    {
        $request->validate(['content' => 'required|min:5']);
        $analysis = $this->aiService->analyze($request->content);

        $review = Review::create([
            'user_id' => $request->user()->id,
            'content' => $request->content,
            'sentiment' => $analysis['sentiment'],
            'score' => $analysis['score'],
            'topics' => $analysis['topics'],
        ]);

        return response()->json($review, 201);
    }

    public function destroy(Request $request, $id)
    {
        $review = Review::findOrFail($id);
        // Autorise l'admin OU le propriétaire
        if ($request->user()->role !== 'admin' && $request->user()->id !== $review->user_id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        $review->delete();
        return response()->json(['message' => 'Supprimé']);
    }
}