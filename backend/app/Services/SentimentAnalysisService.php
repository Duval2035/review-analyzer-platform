<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SentimentAnalysisService
{
    protected $apiKey;
    protected $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY');
    }

    public function analyze($text)
    {
        // 1. On prépare le "Prompt" (la consigne pour l'IA)
        $prompt = "
            Analyse l'avis client suivant : \"$text\".
            
            Tu dois répondre UNIQUEMENT avec un objet JSON (sans markdown, sans ```json).
            Le JSON doit contenir exactement ces clés :
            - 'sentiment' : 'positive', 'negative', ou 'neutral'.
            - 'score' : un nombre entier de 0 à 100 (0 = haine, 100 = amour).
            - 'topics' : un tableau de 1 à 3 mots-clés max (ex: ['Livraison', 'Prix']).
        ";

        try {
            // 2. Envoi de la requête à Google Gemini
            $response = Http::post($this->baseUrl . '?key=' . $this->apiKey, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ]
            ]);

            // 3. Vérification si Google a répondu
            if ($response->failed()) {
                Log::error('Erreur Gemini API: ' . $response->body());
                return $this->fallbackResponse(); // Retourne une réponse par défaut si erreur
            }

            $data = $response->json();

            // 4. Extraction du texte de la réponse
            if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                return $this->fallbackResponse();
            }

            $rawText = $data['candidates'][0]['content']['parts'][0]['text'];

            // 5. Nettoyage du JSON (au cas où l'IA ajoute des ```json ...)
            $cleanedJson = str_replace(['```json', '```'], '', $rawText);
            $result = json_decode($cleanedJson, true);

            // Si le décodage échoue, on retourne le fallback
            if (!$result) {
                return $this->fallbackResponse();
            }

            return $result;

        } catch (\Exception $e) {
            Log::error('Exception Gemini: ' . $e->getMessage());
            return $this->fallbackResponse();
        }
    }

    /**
     * Réponse de secours si l'IA est en panne ou injoignable
     */
    private function fallbackResponse()
    {
        return [
            'sentiment' => 'neutral',
            'score' => 50,
            'topics' => ['Non analysé']
        ];
    }
}