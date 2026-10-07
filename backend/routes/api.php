<?php

use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InvitationController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ProjectInvitationController;
use App\Http\Controllers\Api\ProjectMemberController;
use Illuminate\Support\Facades\Route;

Route::post('/register', RegisterController::class)->middleware('throttle:10,1');
Route::post('/login', [LoginController::class, 'login'])->middleware('throttle:20,1');
Route::post('/forgot-password', [PasswordResetController::class, 'sendLink'])->middleware('throttle:5,1');
Route::post('/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:10,1');

// Public invite preview
Route::get('/invitations/{token}', [InvitationController::class, 'show'])->middleware('throttle:30,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [LoginController::class, 'me']);
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::post('/invitations/{token}/accept', [InvitationController::class, 'accept']);

    Route::get('/dashboard', DashboardController::class);

    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);

    // scopeBindings: the invitation must belong to that project
    Route::scopeBindings()->group(function () {
        Route::post('/projects/{project}/invitations', [ProjectInvitationController::class, 'store'])->middleware('throttle:20,1');
        Route::post('/projects/{project}/invitations/{invitation}/resend', [ProjectInvitationController::class, 'resend'])->middleware('throttle:10,1');
        Route::delete('/projects/{project}/invitations/{invitation}', [ProjectInvitationController::class, 'destroy']);
    });

    Route::delete('/projects/{project}/members/{user}', [ProjectMemberController::class, 'destroy']);
});