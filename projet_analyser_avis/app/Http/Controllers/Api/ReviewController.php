<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'content',
        'sentiment', 
        'score',     
        'topics',   
    ];

    protected $casts = [
        'topics' => 'array', // Pour stocker les topics comme un JSON en base
    ];
    
    // Relation : Un avis appartient à un utilisateur 
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}