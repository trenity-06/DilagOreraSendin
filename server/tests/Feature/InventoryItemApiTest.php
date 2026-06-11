<?php

namespace Tests\Feature;

use Tests\TestCase;

class InventoryItemApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite' => [
                'driver' => 'sqlite',
                'database' => ':memory:',
                'prefix' => '',
            ],
        ]);

        $this->app['db']->purge('sqlite');
        $this->artisan('migrate:fresh');
    }

    public function test_inventory_item_can_be_created_updated_and_deleted(): void
    {
        $createResponse = $this->postJson('/api/inventory', [
            'name' => 'Barcode Scanner',
            'category' => 'Electronics',
            'quantity' => 12,
            'reorder_point' => 4,
            'unit_cost' => 18.5,
            'unit_price' => 35,
            'supplier' => 'North Star Supply',
            'image' => 'data:image/png;base64,test-image',
        ]);

        $createResponse->assertOk();
        $itemId = $createResponse->json('item.item_id');

        $this->assertDatabaseHas('tbl_inventory_items', [
            'item_id' => $itemId,
            'name' => 'Barcode Scanner',
            'current_stock' => 12,
            'supplier' => 'North Star Supply',
        ]);

        $updateResponse = $this->putJson('/api/inventory/' . $itemId, [
            'name' => 'Barcode Scanner Pro',
            'category' => 'Electronics',
            'quantity' => 24,
            'reorder_point' => 6,
            'unit_cost' => 20,
            'unit_price' => 40,
            'supplier' => 'North Star Supply',
            'image' => 'data:image/png;base64,updated-image',
        ]);

        $updateResponse->assertOk();

        $this->assertDatabaseHas('tbl_inventory_items', [
            'item_id' => $itemId,
            'name' => 'Barcode Scanner Pro',
            'current_stock' => 24,
            'reorder_point' => 6,
            'supplier' => 'North Star Supply',
            'image' => 'data:image/png;base64,updated-image',
        ]);

        $deleteResponse = $this->deleteJson('/api/inventory/' . $itemId);

        $deleteResponse->assertOk();
        $this->assertDatabaseMissing('tbl_inventory_items', [
            'item_id' => $itemId,
        ]);
    }
}
