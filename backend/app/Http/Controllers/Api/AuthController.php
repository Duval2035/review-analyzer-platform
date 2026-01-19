<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    
     // Inscription d'un nouvel utilisateur (POST /api/register)
    
    public function register(Request $request)
    {
        //  Validation des données
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Création de l'utilisateur
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            // Définir un rôle par défaut si vous voulez implémenter 'user' vs 'admin'
            'role' => 'user',
        ]);

        //  Création du token
        $token = $user->createToken('auth_token')->plainTextToken;

        //  Retour de la réponse
        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    // Connexion de l'utilisateur (POST /api/login)
    
    public function login(Request $request)
    {
        //Validation des données
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        //  Vérification des identifiants (email et mot de passe)
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            // Lève une exception de validation si les identifiants sont invalides
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        //  Suppression des anciens tokens 
        $user->tokens()->delete();

        // Création d'un nouveau token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Retour de la réponse
        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ]);
    }

    // Déconnexion de l'utilisateur (POST /api/logout)
     
    public function logout(Request $request)
    {
        // Supprime le token actuel utilisé pour l'authentification de cette requête
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }
}
