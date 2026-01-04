<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    /**
     * Les attributs qui peuvent être remplis massivement.
     */
    protected $fillable = [
        'user_id',
        'content',
        'sentiment',
        'score',
        'topics',
    ];

    /**
     * Conversion automatique des types (Casting).
     * Très important pour transformer le JSON de la DB en tableau PHP.
     */
    protected $casts = [
        'topics' => 'array', 
        'score' => 'integer',
    ];

    /**
     * Un avis appartient à un utilisateur.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}