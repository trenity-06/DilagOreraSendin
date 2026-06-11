<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_johndoe_account_can_log_in(): void
    {
        $this->artisan('db:seed', ['--class' => 'DatabaseSeeder']);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'johndoe',
            'password' => 'johndoe',
        ]);

        $response->assertOk();
        $response->assertJsonPath('user.username', 'johndoe');
    }
}
