<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'content', 'sentiment', 'score', 'topics'
    ];

    protected $casts = [
        'topics' => 'array', 
        'score' => 'integer'
    ];
}