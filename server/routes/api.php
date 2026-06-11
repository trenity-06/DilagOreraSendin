<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GenderController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\POSController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::controller(AuthController::class)->prefix('/auth')->group(function() {
    Route::post('/login', 'login');
});

Route::controller(InventoryController::class)->prefix('/inventory')->group(function() {
    Route::get('/', 'index');
    Route::post('/', 'store');
    Route::put('/{inventoryItem}', 'update');
    Route::delete('/{inventoryItem}', 'destroy');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::controller(AuthController::class)->prefix('/auth')->group(function() {
        Route::get('/me', 'me');
        Route::post('/logout', 'logout');
    });

    Route::controller(GenderController::class)->prefix('/gender')->group(function() {
        Route::get('/loadGenders', 'loadGenders'); // /gender/loadGenders
        Route::get('/getGender/{genderId}', 'getGender');
        Route::post('/storeGender', 'storeGender'); // /gender/storeGender
        Route::put('/updateGender/{gender}', 'updateGender');
        Route::put('/destroyGender/{gender}', 'destroyGender');
    });

    Route::controller(UserController::class)->prefix('/user')->group(function() {
        Route::get('/loadUsers', 'loadUsers');
        Route::post('/storeUser', 'storeUser');
        Route::put('/updateUser/{user}', 'updateUser');
        Route::put('/destroyUser/{user}', 'destroyUser');
    });

    // POS checkout: creates sale + OUT inventory transactions + decreases stock
    Route::post('/pos/checkout', [POSController::class, 'checkout']);

    // POS: list recent sales from DB
    Route::get('/pos/sales', [POSController::class, 'listSales']);
});

