<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            // Lien avec l'utilisateur qui a posté l'avis
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('content'); // Le texte de l'avis
            $table->string('sentiment'); // 'positive', 'negative', 'neutral'
            $table->integer('score'); // Note de 0 à 100
            $table->json('topics')->nullable(); // Thèmes détectés (ex: livraison, prix)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};