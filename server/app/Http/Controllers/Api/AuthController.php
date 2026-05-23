<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request) {
        $validated = $request->validate([
            'username' => ['required', 'min:6', 'max:12'],
            'password' => ['required', 'min:6', 'max:12']
        ]);

        $user = User::with(['gender'])
        ->where('tbl_users.username', $validated['username'])
        ->where('tbl_users.is_deleted', false)
        ->first();

    if (!$user) {
        return response()->json([
            'message' => 'The provided credentials are incorrect.',
        ], 401);
    }

    // Works with BOTH hashed passwords and raw seeded passwords.
    // (Your User model currently casts password as 'hashed', which can interfere with direct compare.)
    $storedPassword = $user->getRawOriginal('password') ?? $user->password;

    $passwordMatches = false;

    // 1) Hashed password check (normal case)
    if (is_string($storedPassword) && \Illuminate\Support\Facades\Hash::needsRehash($storedPassword) === false) {
        $passwordMatches = \Illuminate\Support\Facades\Hash::check($validated['password'], $storedPassword);
    } else {
        // Even if it’s not a valid hash format, Hash::check will safely return false.
        $passwordMatches = \Illuminate\Support\Facades\Hash::check($validated['password'], (string) $storedPassword);
    }

    // 2) Raw fallback (for seeded/plain-text passwords)
    if (!$passwordMatches) {
        $passwordMatches = $validated['password'] === (string) $storedPassword;
    }

    if (!$passwordMatches) {
        return response()->json([
            'message' => 'The provided credentials are incorrect.',
        ], 401);
    }

    $user->tokens()->delete();

    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'user' => $user,
        'token' => $token
    ], 200);

   }

    public function logout(Request $request)
{
    $request->user()->currentAccessToken()->delete();

    return response()->json([
        'message' => 'Logged Out Successfully'
    ], 200);
}

    public function me(Request $request)
{
    return response()->json([
        'user' => $request->user()->load(['gender'])
    ], 200);
}
}
