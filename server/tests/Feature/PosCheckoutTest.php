<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\User;
use App\Models\Gender;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PosCheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Gender::create(['gender' => 'Male']);
    }

    public function test_checkout_fails_if_stock_is_insufficient()
    {
        $user = User::factory()->create();
        $item = InventoryItem::create([
            'name' => 'Test Item',
            'category' => 'Test Category',
            'current_stock' => 5,
            'purchase_cost' => 10,
            'sell_price' => 20,
            'is_deleted' => false,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/pos/checkout', [
                'line_items' => [
                    [
                        'item_id' => $item->item_id,
                        'quantity' => 10, // More than 5
                        'unit_price' => 20,
                    ],
                ],
            ]);

        $response->assertStatus(400)
            ->assertJsonPath('message', 'Checkout failed.')
            ->assertJsonFragment(['error' => "Insufficient stock for item: Test Item. Available: 5, Requested: 10"]);

        // Verify stock was NOT reduced
        $item->refresh();
        $this->assertEquals(5, $item->current_stock);
    }

    public function test_checkout_succeeds_if_stock_is_sufficient()
    {
        $user = User::factory()->create();
        $item = InventoryItem::create([
            'name' => 'Test Item',
            'category' => 'Test Category',
            'current_stock' => 10,
            'purchase_cost' => 10,
            'sell_price' => 20,
            'is_deleted' => false,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/pos/checkout', [
                'line_items' => [
                    [
                        'item_id' => $item->item_id,
                        'quantity' => 3,
                        'unit_price' => 20,
                    ],
                ],
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Sale recorded successfully.');

        // Verify stock WAS reduced
        $item->refresh();
        $this->assertEquals(7, $item->current_stock);
    }
}
