<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{   
     public function update(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'min:2', 'max:80']]);
        $request->user()->update($data);

        return (new UserResource($request->user()->loadCount('projects')))->response()->setStatusCode(200);
    }

    public function password(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            // Google-only accounts have no password yet, so they can set one directly
            'current_password' => [$user->password ? 'required' : 'nullable', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        if ($user->password && ! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'Your current password is incorrect.']);
        }

        $user->forceFill(['password' => $request->password])->save();

        return response()->json(['message' => 'Password updated.']);
    }
}