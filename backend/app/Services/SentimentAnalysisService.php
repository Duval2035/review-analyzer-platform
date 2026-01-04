namespace App\Services;

class SentimentAnalysisService {
    public function analyze($text) {
        $positive = ['bon', 'excellent', 'super', 'parfait', 'rapide']; // [cite: 30]
        $negative = ['mauvais', 'nul', 'lent', 'cher', 'déçu']; // [cite: 30]
        
        $text = strtolower($text);
        $score = 50; 
        
        // Logique NLP simple (Rule-based) [cite: 29]
        foreach($positive as $word) if(str_contains($text, $word)) $score += 10;
        foreach($negative as $word) if(str_contains($text, $word)) $score -= 10;

        return [
            'sentiment' => $score > 55 ? 'positive' : ($score < 45 ? 'negative' : 'neutral'), // [cite: 28]
            'score' => max(0, min(100, $score)), // [cite: 34]
            'topics' => str_contains($text, 'livraison') ? ['delivery'] : [] // [cite: 32]
        ];
    }
}