<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Gender;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);

        Gender::factory()->createMany([
            ['gender' => 'Male'],
            ['gender' => 'Female'],
            ['gender' => 'Prefer Not to Say']
        ]);

        $birthDate = fake()->date();
        $age = date_diff(date_create($birthDate), date_create('now'))->y;

        User::updateOrCreate(
            ['username' => 'johndoe'],
            [
                'first_name' => 'John',
                'middle_name' => 'B',
                'last_name' => 'Doe',
                'suffix_name' => null,
                'gender_id' => Gender::where('gender', 'Male')->first()?->gender_id ?? Gender::inRandomOrder()->first()->gender_id,
                'birth_date' => $birthDate,
                'age' => $age,
                'username' => 'johndoe',
                'password' => Hash::make('johndoe'),
            ]
        );

        // Admin credentials for login testing
        User::updateOrCreate(
            ['username' => 'Admin'],
            [
                'first_name' => 'Admin',
                'middle_name' => null,
                'last_name' => 'User',
                'suffix_name' => null,
                'gender_id' => Gender::where('gender', 'Male')->first()?->gender_id ?? Gender::inRandomOrder()->first()->gender_id,
                'birth_date' => $birthDate,
                'age' => $age,
                'username' => 'Admin',
                'password' => Hash::make('admin1234'),
                'is_deleted' => false,
            ]
        );

        User::factory(100)->create();

    }
}
