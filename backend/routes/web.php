<?php

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

Route::get('/test-google', function () {
    $apiKey = env('GEMINI_API_KEY');
    // On demande la liste des modèles disponibles pour cette clé
    $response = Http::withoutVerifying()->get("https://generativelanguage.googleapis.com/v1beta/models?key={$apiKey}");
    return $response->json();
});
