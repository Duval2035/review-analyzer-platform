use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Routes d'Authentification (pas de protection par token nécessaire ici)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Exemple de route protégée (vous utiliserez ceci pour les autres fonctionnalités)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    // Ajoutez ici les routes pour Reviews, Dashboard, etc.
});