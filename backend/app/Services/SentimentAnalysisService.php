<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SentimentAnalysisService
{
    protected $apiKey;
    // URL officielle pour le modèle Flash (le plus fiable actuellement)
    protected $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY');
    }

    public function analyze($text)
    {
        $prompt = "
            Analyse l'avis client suivant : \"$text\".
            Réponds UNIQUEMENT avec un JSON valide :
            - 'sentiment' : 'positive', 'negative', 'neutral'
            - 'score' : entier 0-100
            - 'topics' : tableau de mots-clés (ex: ['Prix', 'Qualité'])
        ";

        try {
            // withoutVerifying() est nécessaire pour WAMP/Laragon/Windows
            $response = Http::withoutVerifying()->post($this->baseUrl . '?key=' . $this->apiKey, [
                'contents' => [['parts' => [['text' => $prompt]]]]
            ]);

            if ($response->failed()) {
                // On log l'erreur pour la voir
                Log::error('Erreur Gemini: ' . $response->body());
                return $this->fallback('Err Google ' . $response->status());
            }

            $data = $response->json();
            
            // Sécurité si la réponse est vide
            if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                return $this->fallback('Réponse vide');
            }

            $rawText = $data['candidates'][0]['content']['parts'][0]['text'];
            $cleanJson = str_replace(['```json', '```'], '', $rawText);
            
            $result = json_decode($cleanJson, true);

            return $result ?: $this->fallback('JSON Invalide');

        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return $this->fallback('Err Connexion');
        }
    }

    private function fallback($reason)
    {
        return [
            'sentiment' => 'neutral',
            'score' => 50,
            'topics' => [$reason] // L'erreur s'affichera sur le dashboard
        ];
    }
}