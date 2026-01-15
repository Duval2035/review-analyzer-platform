<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ReviewController;

// ====================================================
// ROUTES PUBLIQUES (Pas besoin de connexion)
// ====================================================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ====================================================
// ROUTES PROTÉGÉES (Token requis)
// ====================================================
Route::middleware('auth:sanctum')->group(function () {
    
    // 1. Gestion Utilisateur
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // 2. Fonctionnalités Spéciales (À placer AVANT apiResource)
    // Récupérer les statistiques pour le Dashboard
    Route::get('/stats', [ReviewController::class, 'stats']);
    
    // Analyser un texte via IA sans l'enregistrer (Exigence PDF)
    Route::post('/analyze', [ReviewController::class, 'analyze']);

    // 3. CRUD Complet des Avis (index, store, show, update, destroy)
    Route::apiResource('reviews', ReviewController::class);
});