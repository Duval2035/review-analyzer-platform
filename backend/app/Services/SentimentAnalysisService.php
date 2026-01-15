<?php

namespace App\Services;

class SentimentAnalysisService
{
    // Plus besoin de clé API pour cette version de secours
    
    public function analyze($text)
    {
        // 1. On convertit le texte en minuscules pour chercher des mots
        $lowerText = strtolower($text);

        // 2. Détection basique (Simulation d'IA)
        // Mots positifs
        if (str_contains($lowerText, 'génial') || 
            str_contains($lowerText, 'top') || 
            str_contains($lowerText, 'bravo') || 
            str_contains($lowerText, 'rapide') || 
            str_contains($lowerText, 'aime') || 
            str_contains($lowerText, 'excellent')) {
            
            return [
                'sentiment' => 'positive',
                'score' => rand(80, 100), // Score aléatoire entre 80 et 100
                'topics' => ['Qualité', 'Service']
            ];
        }

        // Mots négatifs
        if (str_contains($lowerText, 'retard') || 
            str_contains($lowerText, 'nul') || 
            str_contains($lowerText, 'mauvais') || 
            str_contains($lowerText, 'pas reçu')) {
            
            return [
                'sentiment' => 'negative',
                'score' => rand(10, 40),
                'topics' => ['Problème', 'Livraison']
            ];
        }

        // Par défaut (Neutre)
        return [
            'sentiment' => 'neutral',
            'score' => 50,
            'topics' => ['Général']
        ];
    }
}