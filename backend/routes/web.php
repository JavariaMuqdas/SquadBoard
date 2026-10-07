<?php

use App\Http\Controllers\Auth\GoogleController;
use Illuminate\Support\Facades\Route;

// Google login runs on web routes because it is a full-page redirect, not an XHR call.
Route::get('/oauth/google/redirect', [GoogleController::class, 'redirect']);
Route::get('/oauth/google/callback', [GoogleController::class, 'callback']);

Route::get('/', fn () => response()->json(['app' => 'SquadBoard API', 'status' => 'ok']));
