<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ReviewController;
use App\Services\SentimentAnalysisService;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Routes protégées
Route::middleware('auth:sanctum')->group(function () {
    
    // Authentification & Profil
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // 2. Gestion des Avis (CRUD)
    // Cette ligne gère : GET (index), POST (store), GET (show), PUT (update), DELETE (destroy)
    Route::apiResource('reviews', ReviewController::class);

    // 3. Statistiques du Tableau de Bord
    // Demandé pour les % d'avis, top thèmes et note moyenne
    Route::get('/stats', [ReviewController::class, 'stats']);

    // 4. Analyse IA manuelle (Endpoint séparé obligatoire)
    // Permet d'analyser un texte sans forcément l'enregistrer en base de données
    Route::post('/analyze', [ReviewController::class, 'analyze']);
    Route::post('/analyze', function (Request $request, SentimentAnalysisService $ia) {
        $request->validate(['text' => 'required|string']);
        return response()->json($ia->analyze($request->text));
    });

});